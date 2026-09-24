// NON_CERTIFYING_REHEARSAL enrollment EFI app (candidate, unreviewed).
// Single setup-mode invocation: enroll db -> KEK -> PK from pre-authenticated
// .auth blobs, then capture SecureBoot/SetupMode (raw value + attributes +
// status) and read back PK/KEK/db, write canonical evidence to ENROLL.TXT on
// the same FAT volume, then shut down. No crypto in-app: firmware verifies the
// auth descriptors. Never launched again after PK enrollment.
#include <efi.h>
#include <efilib.h>

static EFI_GUID GvGuid = {0x8BE4DF61,0x93CA,0x11d2,{0xAA,0x0D,0x00,0xE0,0x98,0x03,0x2B,0x8C}};
static EFI_GUID DbGuid = {0xd719b2cb,0x3d3a,0x4596,{0xa3,0xbc,0xda,0xd0,0x0e,0x67,0x65,0x6f}};
static EFI_GUID FsGuid = EFI_SIMPLE_FILE_SYSTEM_PROTOCOL_GUID;
static EFI_GUID LiGuid = EFI_LOADED_IMAGE_PROTOCOL_GUID;

#define ATTRS (EFI_VARIABLE_NON_VOLATILE|EFI_VARIABLE_BOOTSERVICE_ACCESS|EFI_VARIABLE_RUNTIME_ACCESS|EFI_VARIABLE_TIME_BASED_AUTHENTICATED_WRITE_ACCESS)

static EFI_FILE *root;
static EFI_FILE *ev;
static UINTN line_no;

static void hex(EFI_FILE *f, UINT8 *p, UINTN n){ CHAR16 b[3]; UINTN i; for(i=0;i<n;i++){ b[0]=(CHAR16)L"0123456789abcdef"[p[i]>>4]; b[1]=(CHAR16)L"0123456789abcdef"[p[i]&15]; b[2]=0; uefi_call_wrapper(f->Write,3,f,&(UINTN){4},b);} }
static void put(EFI_FILE *f, CHAR16 *s){ uefi_call_wrapper(f->Write,3,f,&(UINTN){StrLen(s)*2},s); }
static void putnum(EFI_FILE *f, UINTN v){ CHAR16 b[24]; UINTN i=24; b[--i]=0; if(!v)b[--i]=L'0'; while(v){b[--i]=(CHAR16)(L'0'+v%10);v/=10;} put(f,&b[i]); }

static EFI_STATUS readfile(CHAR16 *name, UINT8 **buf, UINTN *sz){
    EFI_FILE *fh; EFI_STATUS s; UINT8 info[256]; UINTN isz=256;
    s=uefi_call_wrapper(root->Open,5,root,&fh,name,EFI_FILE_MODE_READ,0);
    if(EFI_ERROR(s)) return s;
    s=uefi_call_wrapper(fh->GetInfo,4,fh,&gEfiFileInfoGuid,&isz,info);
    if(EFI_ERROR(s)) return s;
    *sz=((EFI_FILE_INFO*)info)->FileSize;
    s=uefi_call_wrapper(BS->AllocatePool,3,EfiLoaderData,*sz,(void**)buf);
    if(EFI_ERROR(s)) return s;
    return uefi_call_wrapper(fh->Read,3,fh,sz,*buf);
}

static void report_var(CHAR16 *name, EFI_GUID *g){
    EFI_STATUS s; UINT8 buf[8192]; UINTN sz=sizeof(buf); UINT32 attr=0; UINTN i;
    s=uefi_call_wrapper(RT->GetVariable,5,name,g,&attr,&sz,buf);
    put(ev,name); put(ev,L"_GET_STATUS="); putnum(ev,s); put(ev,L"\n");
    if(!EFI_ERROR(s)){
        put(ev,name); put(ev,L"_ATTR="); putnum(ev,attr); put(ev,L"\n");
        put(ev,name); put(ev,L"_SIZE="); putnum(ev,sz); put(ev,L"\n");
        put(ev,name); put(ev,L"_DATA="); hex(ev,buf,sz); put(ev,L"\n");
    }
}

EFI_STATUS efi_main(EFI_HANDLE image, EFI_SYSTEM_TABLE *st){
    EFI_LOADED_IMAGE_PROTOCOL *li; EFI_SIMPLE_FILE_SYSTEM_PROTOCOL *fs;
    EFI_STATUS s, sdb, skek, spk; UINT8 *bdb=0,*bkek=0,*bpk=0; UINTN sdb_sz=0,skek_sz=0,spk_sz=0;
    InitializeLib(image, st);
    s=uefi_call_wrapper(BS->HandleProtocol,3,image,&LiGuid,(void**)&li);
    if(EFI_ERROR(s)) return s;
    s=uefi_call_wrapper(BS->HandleProtocol,3,li->DeviceHandle,&FsGuid,(void**)&fs);
    if(EFI_ERROR(s)) return s;
    s=uefi_call_wrapper(fs->OpenVolume,2,fs,&root);
    if(EFI_ERROR(s)) return s;
    s=uefi_call_wrapper(root->Open,5,root,&ev,L"ENROLL.TXT",EFI_FILE_MODE_READ|EFI_FILE_MODE_WRITE|EFI_FILE_MODE_CREATE,0);
    if(EFI_ERROR(s)) return s;
    put(ev,L"SCHEMA=NON_CERTIFYING_REHEARSAL.ENROLL_EVIDENCE.V1\n");
    if(readfile(L"db.auth",&bdb,&sdb_sz)) { put(ev,L"FATAL=READ_DB_AUTH\n"); goto out; }
    if(readfile(L"kek.auth",&bkek,&skek_sz)) { put(ev,L"FATAL=READ_KEK_AUTH\n"); goto out; }
    if(readfile(L"pk.auth",&bpk,&spk_sz)) { put(ev,L"FATAL=READ_PK_AUTH\n"); goto out; }
    sdb =uefi_call_wrapper(RT->SetVariable,5,L"db",&DbGuid,ATTRS,sdb_sz,bdb);
    put(ev,L"SET_DB_STATUS="); putnum(ev,sdb); put(ev,L"\n");
    skek=uefi_call_wrapper(RT->SetVariable,5,L"KEK",&GvGuid,ATTRS,skek_sz,bkek);
    put(ev,L"SET_KEK_STATUS="); putnum(ev,skek); put(ev,L"\n");
    spk =uefi_call_wrapper(RT->SetVariable,5,L"PK",&GvGuid,ATTRS,spk_sz,bpk);
    put(ev,L"SET_PK_STATUS="); putnum(ev,spk); put(ev,L"\n");
    report_var(L"SecureBoot",&GvGuid);
    report_var(L"SetupMode",&GvGuid);
    report_var(L"PK",&GvGuid);
    report_var(L"KEK",&GvGuid);
    report_var(L"db",&DbGuid);
    put(ev,L"END\n");
out:
    uefi_call_wrapper(ev->Flush,1,ev);
    uefi_call_wrapper(ev->Close,1,ev);
    uefi_call_wrapper(BS->Stall,1,2000000);
    uefi_call_wrapper(RT->ResetSystem,4,EfiResetShutdown,EFI_SUCCESS,0,NULL);
    return EFI_SUCCESS;
}
