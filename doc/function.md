Dựa trên tài liệu LMS, hệ thống thi online có thể phân rã chức năng như sau. Tài liệu gốc xác định các module chính gồm Authentication, User Management, Learning Materials, Question Bank, Exam Management, Exam Engine, Scoring, Result & History, Reporting. 

## 1. Nhóm chức năng Quản trị hệ thống

| Mã  | Chức năng cha          | Chức năng con                                                   |
| --- | ---------------------- | --------------------------------------------------------------- |
| 1.1 | Đăng nhập & phân quyền | Đăng nhập, đăng xuất, đổi mật khẩu                              |
| 1.2 | Phân quyền             | Quản lý vai trò Admin/Học viên, kiểm tra quyền truy cập         |
| 1.3 | Quản lý tài khoản      | Tạo tài khoản, xem danh sách user, khóa/mở khóa, reset mật khẩu |
| 1.4 | Quản lý nhóm học viên  | Tạo nhóm, thêm/xóa học viên, gán khóa học/bài thi theo nhóm     |
| 1.5 | Audit log              | Ghi log đăng nhập, submit bài, CRUD dữ liệu, phân quyền, export |

## 2. Nhóm chức năng Quản lý học tập

| Mã  | Chức năng cha    | Chức năng con                                              |
| --- | ---------------- | ---------------------------------------------------------- |
| 2.1 | Quản lý khóa học | Tạo/sửa/xóa khóa học, xem danh sách khóa học               |
| 2.2 | Gán khóa học     | Gán khóa học cho user hoặc nhóm                            |
| 2.3 | Quản lý học liệu | Thêm/sửa/xóa học liệu text, PDF, file download, link ngoài |
| 2.4 | Học học liệu     | Xem học liệu, tải file, mở link/PDF                        |
| 2.5 | Theo dõi tiến độ | Lưu đã xem/chưa xem, thời gian học gần nhất, % hoàn thành  |

## 3. Nhóm chức năng Ngân hàng câu hỏi

| Mã  | Chức năng cha        | Chức năng con                                                    |
| --- | -------------------- | ---------------------------------------------------------------- |
| 3.1 | Quản lý câu hỏi      | Tạo, sửa, xóa câu hỏi                                            |
| 3.2 | Phân loại câu hỏi    | Theo chủ đề/category, độ khó Easy/Medium/Hard                    |
| 3.3 | Quản lý đáp án       | Thêm/sửa/xóa lựa chọn đáp án                                     |
| 3.4 | Cấu hình đáp án đúng | Single choice: 1 đáp án đúng; Multiple choice: nhiều đáp án đúng |
| 3.5 | Cấu hình điểm        | Gán điểm số cho từng câu hỏi                                     |

## 4. Nhóm chức năng Quản lý bài thi

| Mã  | Chức năng cha     | Chức năng con                                            |
| --- | ----------------- | -------------------------------------------------------- |
| 4.1 | Tạo bài thi       | Tạo thủ công hoặc random từ ngân hàng câu hỏi            |
| 4.2 | Cấu hình bài thi  | Tên, mô tả, thời gian, tổng điểm, pass score, số lần thi |
| 4.3 | Cấu hình random   | Random theo chủ đề, số lượng, độ khó                     |
| 4.4 | Cấu hình hiển thị | Random câu hỏi, random đáp án, hiển thị đáp án sau thi   |
| 4.5 | Cấu hình review   | FULL_REVIEW, RESULT_ONLY, ANSWER_ONLY, NO_REVIEW         |
| 4.6 | Gán bài thi       | Gán cho khóa học, user, nhóm hoặc standalone exam        |

## 5. Nhóm chức năng Làm bài thi

| Mã  | Chức năng cha          | Chức năng con                                                          |
| --- | ---------------------- | ---------------------------------------------------------------------- |
| 5.1 | Kiểm tra điều kiện thi | Kiểm tra login, quyền truy cập, hoàn thành học liệu nếu là course exam |
| 5.2 | Bắt đầu thi            | Tạo attempt, ghi nhận thời gian bắt đầu, sinh đề thi                   |
| 5.3 | Snapshot đề thi        | Lưu cố định câu hỏi/đáp án tại thời điểm bắt đầu thi                   |
| 5.4 | Làm bài                | Chọn đáp án, chuyển câu, đánh dấu review, xem câu chưa trả lời         |
| 5.5 | Bộ đếm thời gian       | Countdown timer, cảnh báo hết giờ                                      |
| 5.6 | Autosave               | Tự động lưu đáp án định kỳ 15–30 giây                                  |
| 5.7 | Nộp bài                | Submit thủ công hoặc auto submit khi hết giờ                           |
| 5.8 | Chống submit trùng     | Chỉ ghi nhận lần submit đầu tiên                                       |

## 6. Nhóm chức năng Chấm điểm & kết quả

| Mã  | Chức năng cha      | Chức năng con                                               |
| --- | ------------------ | ----------------------------------------------------------- |
| 6.1 | Chấm điểm tự động  | Chấm single choice, multiple choice                         |
| 6.2 | Tính tổng điểm     | Cộng điểm các câu đúng                                      |
| 6.3 | Xác định pass/fail | So sánh với pass score                                      |
| 6.4 | Lưu kết quả        | Điểm, trạng thái, lần thi, thời gian làm bài, thời gian nộp |
| 6.5 | Xem lịch sử thi    | Danh sách attempt, điểm từng lần, xu hướng cải thiện        |
| 6.6 | Xem lại bài làm    | Hiển thị theo review policy của bài thi                     |

## 7. Nhóm chức năng Certificate

| Mã  | Chức năng cha                     | Chức năng con                                     |
| --- | --------------------------------- | ------------------------------------------------- |
| 7.1 | Kiểm tra điều kiện cấp chứng nhận | User pass và exam/course cho phép cấp certificate |
| 7.2 | Sinh certificate                  | Tạo mã certificate, render PDF                    |
| 7.3 | Tải certificate                   | Học viên tải file PDF chứng nhận                  |
| 7.4 | Lưu certificate                   | Lưu lịch sử certificate đã cấp                    |

## 8. Nhóm chức năng Báo cáo

| Mã  | Chức năng cha   | Chức năng con                                    |
| --- | --------------- | ------------------------------------------------ |
| 8.1 | Báo cáo học tập | Số user học, tỷ lệ hoàn thành                    |
| 8.2 | Báo cáo thi     | Tỷ lệ pass/fail, điểm trung bình, phân bố điểm   |
| 8.3 | Báo cáo câu hỏi | Tỷ lệ trả lời đúng, câu hỏi khó/dễ               |
| 8.4 | Export báo cáo  | Xuất Excel/PDF theo khóa học, bài thi, thời gian |

## 9. Phân rã theo vai trò

**Admin**: quản lý user, nhóm, khóa học, học liệu, ngân hàng câu hỏi, bài thi, phân quyền, báo cáo, export, audit log.

**Học viên**: đăng nhập, đổi mật khẩu, xem khóa học, học học liệu, theo dõi tiến độ, vào thi, làm bài, xem kết quả, xem lịch sử, tải certificate.

**Hệ thống**: kiểm tra quyền, kiểm tra điều kiện thi, random đề, snapshot đề, autosave, auto submit, chấm điểm, sinh kết quả, sinh certificate, ghi audit log.
