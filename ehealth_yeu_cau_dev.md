# Tài liệu mô tả yêu cầu chỉnh sửa hệ thống EHealth

## Mục tiêu
Tài liệu này dùng để diễn đạt lại các yêu cầu hiện tại thành ngôn ngữ rõ ràng, dễ hiểu để đội dev có thể nắm vấn đề và triển khai code. Trọng tâm là làm cho trải nghiệm giữa landing page, cổng bệnh nhân, hồ sơ bệnh nhân và luồng đặt lịch trở nên đồng bộ, logic và mở rộng hơn.

---

## 1. Đồng bộ giữa Landing Page và Cổng bệnh nhân

### Vấn đề hiện tại
Landing page và cổng bệnh nhân đang cho cảm giác như là hai hệ thống tách rời nhau. Người dùng đi từ landing page sang cổng bệnh nhân nhưng không thấy tính liên kết về mặt điều hướng, dữ liệu, trải nghiệm và nhận diện luồng sử dụng.

### Yêu cầu
Cần thiết kế lại để landing page và cổng bệnh nhân liên kết logic với nhau như cùng nằm trong một hệ thống thống nhất.

### Mong muốn cụ thể
- Các nút hành động chính ở landing page như **Đặt lịch khám**, **Đăng nhập**, **Xem bác sĩ**, **Xem chuyên khoa** phải dẫn đúng sang các màn tương ứng trong cổng bệnh nhân hoặc luồng booking.
- Nếu người dùng đã đăng nhập ở landing page thì khi vào cổng bệnh nhân phải giữ nguyên trạng thái đăng nhập, không tạo cảm giác như sang một hệ thống khác.
- Thông tin hiển thị như danh sách bác sĩ, chuyên khoa, dịch vụ nên đồng bộ dữ liệu giữa landing page và portal, tránh mỗi nơi một kiểu.
- Header, menu, CTA và cách điều hướng nên có tư duy xuyên suốt, để người dùng hiểu rằng landing page là nơi giới thiệu, còn cổng bệnh nhân là nơi thao tác sâu hơn trong cùng một sản phẩm.
- Nếu cần, có thể thống nhất route strategy hoặc navigation strategy giữa hai bên để tránh cảm giác rời rạc.

### Kỳ vọng sau khi sửa
Người dùng có thể bắt đầu từ landing page và đi xuyên suốt đến đặt lịch, quản lý hồ sơ, xem lịch hẹn mà không bị đứt mạch trải nghiệm.

---

## 2. Thiết kế lại luồng đặt lịch: thêm “Khám theo dịch vụ” và cho phép kết hợp tiêu chí

### Vấn đề hiện tại
Luồng đặt lịch hiện đang tách cứng thành:
- Khám theo chuyên khoa
- Khám theo bác sĩ

Cách này làm trải nghiệm bị rời rạc. Nếu người dùng muốn đi từ dịch vụ → chuyên khoa → bác sĩ hoặc từ chuyên khoa → dịch vụ → bác sĩ thì chưa hỗ trợ tốt.

### Yêu cầu
Bổ sung thêm hình thức **Khám theo dịch vụ** và thiết kế lại luồng booking theo hướng linh hoạt hơn, không tách rời tuyệt đối từng kiểu đặt lịch.

### Mong muốn nghiệp vụ
Thay vì xem “khám theo chuyên khoa”, “khám theo bác sĩ”, “khám theo dịch vụ” là ba luồng hoàn toàn độc lập, cần xem đây là các điểm bắt đầu khác nhau để cùng đi đến một kết quả cuối là chọn được lịch phù hợp.

### Đề xuất hướng triển khai
Có thể thiết kế lại bước đầu tiên của booking thành:

#### Cách chọn điểm bắt đầu
- Đặt theo chuyên khoa
- Đặt theo bác sĩ
- Đặt theo dịch vụ

Sau khi chọn một điểm bắt đầu, người dùng vẫn có thể bổ sung các tiêu chí còn lại nếu muốn. Ví dụ:
- Chọn **dịch vụ** trước, sau đó hệ thống gợi ý **chuyên khoa phù hợp**, rồi tiếp tục chọn **bác sĩ**
- Chọn **chuyên khoa** trước, sau đó có thể lọc thêm theo **dịch vụ**
- Chọn **bác sĩ** trước, sau đó hiển thị các **dịch vụ** hoặc **hình thức khám** mà bác sĩ đó hỗ trợ

### Yêu cầu chi tiết
- Bổ sung dữ liệu và UI cho danh mục **dịch vụ khám**
- Cho phép các tiêu chí có quan hệ lọc lẫn nhau:
  - Dịch vụ lọc ra chuyên khoa phù hợp
  - Chuyên khoa lọc ra bác sĩ phù hợp
  - Bác sĩ lọc ra khung giờ phù hợp
- Không nên khóa cứng logic kiểu chọn chuyên khoa thì bỏ hẳn luồng bác sĩ, hoặc chọn bác sĩ thì không liên quan chuyên khoa nữa
- Cần có logic fallback:
  - Nếu chọn dịch vụ mà có nhiều chuyên khoa phù hợp thì hiển thị để người dùng chọn
  - Nếu chỉ có một chuyên khoa phù hợp thì có thể auto-select
- Luồng nên mang cảm giác là “lọc dần để ra lịch phù hợp” thay vì “chọn một nhánh độc lập”

### Kỳ vọng sau khi sửa
Luồng booking linh hoạt hơn, tự nhiên hơn, phù hợp với nhiều kiểu suy nghĩ của người dùng.

---

## 3. Mở rộng phần chọn ngày khám

### Vấn đề hiện tại
Màn chọn ngày khám chỉ hiển thị một dãy ngày ngắn, làm người dùng bị giới hạn. Điều này không phù hợp với nhu cầu đặt lịch xa hơn trong tương lai.

### Yêu cầu
Cho phép người dùng chọn ngày linh hoạt hơn, không bị giới hạn chỉ trong một dãy ngày cố định.

### Mong muốn cụ thể
- Người dùng có thể chọn bất kỳ ngày nào còn mở lịch trong năm hiện tại
- Nên hỗ trợ luôn việc chọn ngày ở năm sau nếu hệ thống đã có lịch
- Có thể dùng calendar/date picker đầy đủ thay cho kiểu thanh ngày ngắn hiện tại
- Khi chọn ngày, hệ thống mới load danh sách slot còn trống theo ngày đó
- Cần có rule rõ ràng:
  - Không cho chọn ngày trong quá khứ
  - Chỉ cho chọn các ngày nằm trong phạm vi bác sĩ/chuyên khoa/dịch vụ có mở lịch
  - Nếu chưa có lịch thì hiển thị trạng thái phù hợp

### Kỳ vọng sau khi sửa
Người dùng không bị gò bó vào một vài ngày hiển thị sẵn mà có thể chủ động chọn đúng ngày mong muốn.

---

## 4. Đặt lịch theo hồ sơ bệnh nhân có sẵn trong tài khoản

### Vấn đề hiện tại
Luồng đặt lịch đang nghiêng về việc nhập thông tin bệnh nhân trực tiếp trong form. Điều này chưa tối ưu khi một tài khoản có thể đại diện đặt lịch cho nhiều người trong gia đình.

### Yêu cầu
Khi đặt lịch, người dùng cần được chọn **hồ sơ bệnh nhân có sẵn** trong tài khoản trước, thay vì luôn nhập mới.

### Mong muốn nghiệp vụ
Một tài khoản người dùng có thể quản lý nhiều hồ sơ bệnh nhân, ví dụ:
- Bản thân
- Cha
- Mẹ
- Anh/chị/em
- Con

Khi đặt lịch, người dùng chỉ cần chọn hồ sơ bệnh nhân đã tạo sẵn, hệ thống tự điền thông tin liên quan.

### Yêu cầu chi tiết
- Trong bước nhập thông tin bệnh nhân khi booking, cần có lựa chọn:
  - Chọn hồ sơ đã có
  - Hoặc tạo hồ sơ mới nếu chưa có
- Khi chọn hồ sơ có sẵn, các thông tin như họ tên, ngày sinh, giới tính, CCCD, BHYT, địa chỉ... được load sẵn
- Người dùng chỉ chỉnh sửa nếu được phép
- Cần có một màn **Quản lý hồ sơ bệnh nhân** trong tài khoản để tạo/sửa/xóa hoặc ngừng sử dụng hồ sơ
- Booking phải gắn với **patient profile** cụ thể, không chỉ gắn chung chung với user account

### Kỳ vọng sau khi sửa
Luồng đặt lịch nhanh hơn, đúng thực tế hơn, phù hợp mô hình gia đình dùng chung một tài khoản để đặt lịch cho nhiều người.

---

## 5. Tách rõ Hồ sơ bệnh nhân và Tài khoản người dùng

### Vấn đề hiện tại
Cần làm rõ hơn về mặt domain: **patient profile** và **user account** không phải là một.

### Yêu cầu
Thiết kế và code phải tách bạch:
- **Tài khoản người dùng** là đối tượng dùng để đăng nhập hệ thống
- **Hồ sơ bệnh nhân** là đối tượng y tế/nghiệp vụ dùng để khám chữa bệnh và đặt lịch

### Định nghĩa mong muốn
#### Tài khoản người dùng
Chịu trách nhiệm cho:
- Đăng nhập / đăng xuất
- Email / số điện thoại đăng nhập
- Mật khẩu / bảo mật
- Cài đặt tài khoản
- Thông báo
- Liên kết với nhiều hồ sơ bệnh nhân

#### Hồ sơ bệnh nhân
Chịu trách nhiệm cho:
- Thông tin cá nhân y tế
- Lịch sử khám
- Hồ sơ sức khỏe
- Dị ứng
- Chỉ số sinh hiệu
- BHYT
- Đơn thuốc
- Kết quả khám / CLS
- Nhắc thuốc
- Booking gắn theo từng bệnh nhân cụ thể

### Yêu cầu màn hình/quản trị
Cần phân tách rõ trong portal:
- **Quản lý tài khoản người dùng**
- **Quản lý bệnh nhân / hồ sơ bệnh nhân**

Không nên để người dùng bị hiểu lầm rằng “một tài khoản = một bệnh nhân”.

### Kỳ vọng sau khi sửa
Domain model rõ ràng hơn, dễ scale hơn, thuận lợi cho các tính năng tương lai như hồ sơ gia đình, hồ sơ trẻ em, người giám hộ, người phụ thuộc.

---

## 6. Bổ sung tính năng nhắc thuốc cho bệnh nhân

### Yêu cầu
Thêm một module hoặc tính năng **Nhắc thuốc cho bệnh nhân** trong cổng bệnh nhân.

### Mục tiêu
Giúp bệnh nhân theo dõi việc dùng thuốc đúng giờ, đúng liều, đúng thời gian.

### Mong muốn chức năng
- Hiển thị danh sách thuốc đang dùng
- Mỗi thuốc có các thông tin cơ bản:
  - Tên thuốc
  - Liều dùng
  - Số lần uống trong ngày
  - Thời điểm uống
  - Thời gian dùng từ ngày nào đến ngày nào
  - Ghi chú như trước ăn / sau ăn / buổi sáng / buổi tối
- Có nhắc theo giờ
- Có trạng thái:
  - Đã uống
  - Chưa uống
  - Bỏ qua
- Có lịch sử theo dõi việc tuân thủ dùng thuốc
- Nếu thuốc đến từ đơn sau khám thì nên có khả năng liên kết tự động từ đơn thuốc sang nhắc thuốc
- Nếu chưa có đơn điện tử thì có thể cho phép tạo nhắc thuốc thủ công

### Gợi ý vị trí hiển thị
Có thể đặt ở một trong các vị trí sau:
- Một mục riêng trong cổng bệnh nhân
- Hoặc một tab trong Hồ sơ sức khỏe
- Hoặc một widget/tóm tắt ở Trang chủ bệnh nhân

### Kỳ vọng sau khi bổ sung
Cổng bệnh nhân không chỉ dừng ở đặt lịch và xem hồ sơ mà còn hỗ trợ chăm sóc sau khám.

---

## 7. Đề xuất thay đổi về hướng thiết kế tổng thể

### Mục tiêu tổng thể
Cần chuyển tư duy từ các màn hình rời rạc sang tư duy sản phẩm thống nhất.

### Hướng mong muốn
- Landing page là nơi giới thiệu và dẫn dắt
- Patient portal là nơi thao tác sâu
- Booking flow là luồng xuyên suốt và có thể bắt đầu từ nhiều tiêu chí
- User account là lớp xác thực và quản lý truy cập
- Patient profile là lớp nghiệp vụ y tế
- Sau booking và khám xong, dữ liệu tiếp tục chảy về hồ sơ bệnh nhân, kết quả khám, thuốc, nhắc thuốc

### Ý nghĩa
Khi làm theo hướng này, toàn bộ sản phẩm sẽ liền mạch hơn, dễ mở rộng hơn và đúng logic của một hệ thống healthcare thực tế.

---

## 8. Danh sách công việc dev cần phân tích thêm

### Về frontend
- Rà soát lại navigation giữa landing page và patient portal
- Thiết kế lại bước đầu của booking flow để hỗ trợ:
  - chuyên khoa
  - bác sĩ
  - dịch vụ
- Thay widget chọn ngày hiện tại bằng calendar linh hoạt hơn
- Thêm UI chọn hồ sơ bệnh nhân có sẵn khi booking
- Thêm màn quản lý danh sách hồ sơ bệnh nhân
- Tách rõ giao diện quản lý tài khoản và quản lý bệnh nhân
- Thêm UI nhắc thuốc

### Về backend / domain / database
- Rà soát lại relationship giữa `user_account` và `patient_profile`
- Một user có thể sở hữu hoặc quản lý nhiều patient profiles
- Booking cần reference đến `patient_profile_id`
- Bổ sung entity hoặc module cho `service`
- Xem lại logic mapping:
  - service -> specialty
  - specialty -> doctor
  - doctor -> schedule / slot
- Bổ sung module medication reminder:
  - reminder schedule
  - status tracking
  - linkage with prescription if available

### Về UX / nghiệp vụ
- Luồng đặt lịch cần chuyển từ “tách nhánh” sang “lọc dần”
- Giảm số lần nhập tay thông tin bệnh nhân
- Hỗ trợ use case đặt lịch cho người thân
- Dữ liệu sau khám nên có khả năng liên kết với chăm sóc sau khám như thuốc và nhắc thuốc

---

## 9. Kết luận

Những thay đổi này không chỉ là chỉnh UI mà là chỉnh lại logic sản phẩm để hệ thống đúng hơn với thực tế sử dụng. Trọng tâm lớn nhất là:
- liên kết lại landing page và cổng bệnh nhân
- thiết kế lại luồng đặt lịch theo hướng linh hoạt
- tách rõ user và patient
- hỗ trợ quản lý nhiều hồ sơ bệnh nhân trong một tài khoản
- mở rộng thêm tính năng nhắc thuốc để tăng giá trị sử dụng sau khám

Dev nên xem đây là một đợt refactor cả về flow, domain model và trải nghiệm người dùng, không chỉ là sửa từng màn đơn lẻ.
