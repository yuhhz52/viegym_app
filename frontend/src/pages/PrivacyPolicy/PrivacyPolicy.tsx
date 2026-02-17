import { NavLink } from "react-router-dom";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Chính sách Bảo mật
          </h1>
          <p className="text-gray-500 text-sm">
            Cập nhật lần cuối: Tháng 12, 2025
          </p>
        </div>

        {/* Content */}
        <div className="prose max-w-none text-gray-700 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">1. Thông tin chúng tôi thu thập</h2>
            <p>
              Chúng tôi thu thập thông tin bạn cung cấp trực tiếp cho chúng tôi khi bạn:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Tạo tài khoản và hồ sơ người dùng</li>
              <li>Sử dụng các tính năng tương tác của VieGym</li>
              <li>Tham gia khảo sát hoặc hoạt động khuyến mãi</li>
              <li>Liên hệ với chúng tôi để được hỗ trợ</li>
            </ul>
            <p className="mt-3">
              Thông tin này có thể bao gồm: tên, địa chỉ email, số điện thoại, thông tin sức khỏe và thể chất.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">2. Cách chúng tôi sử dụng thông tin</h2>
            <p>
              Chúng tôi sử dụng thông tin thu thập được để:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Cung cấp, duy trì và cải thiện dịch vụ của chúng tôi</li>
              <li>Cá nhân hóa trải nghiệm người dùng của bạn</li>
              <li>Gửi thông báo kỹ thuật và cập nhật</li>
              <li>Phản hồi yêu cầu hỗ trợ của bạn</li>
              <li>Phát hiện và ngăn chặn gian lận</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">3. Chia sẻ thông tin</h2>
            <p>
              Chúng tôi không chia sẻ thông tin cá nhân của bạn với các bên thứ ba ngoại trừ:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Với sự đồng ý của bạn</li>
              <li>Với các nhà cung cấp dịch vụ hỗ trợ hoạt động kinh doanh của chúng tôi</li>
              <li>Để tuân thủ pháp luật hoặc yêu cầu pháp lý</li>
              <li>Để bảo vệ quyền và an toàn của VieGym và người dùng</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">4. Bảo mật dữ liệu</h2>
            <p>
              Chúng tôi thực hiện các biện pháp bảo mật hợp lý để bảo vệ thông tin của bạn khỏi bị truy cập, 
              sử dụng hoặc tiết lộ trái phép. Tuy nhiên, không có phương thức truyền tải qua Internet nào 
              hoặc phương thức lưu trữ điện tử nào là an toàn 100%.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">5. Quyền của bạn</h2>
            <p>
              Bạn có quyền:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Truy cập và cập nhật thông tin cá nhân của bạn</li>
              <li>Yêu cầu xóa tài khoản và dữ liệu của bạn</li>
              <li>Từ chối nhận email marketing</li>
              <li>Yêu cầu bản sao dữ liệu của bạn</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">6. Cookie và công nghệ theo dõi</h2>
            <p>
              Chúng tôi sử dụng cookie và các công nghệ theo dõi tương tự để theo dõi hoạt động trên 
              dịch vụ của chúng tôi và lưu giữ một số thông tin nhất định. Bạn có thể hướng dẫn trình 
              duyệt của mình từ chối tất cả cookie hoặc để chỉ ra khi nào cookie được gửi.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">7. Trẻ em</h2>
            <p>
              Dịch vụ của chúng tôi không dành cho người dưới 16 tuổi. Chúng tôi không cố ý thu thập 
              thông tin cá nhân từ trẻ em dưới 16 tuổi. Nếu bạn là phụ huynh hoặc người giám hộ và bạn 
              biết rằng con bạn đã cung cấp thông tin cá nhân cho chúng tôi, vui lòng liên hệ với chúng tôi.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">8. Thay đổi chính sách</h2>
            <p>
              Chúng tôi có thể cập nhật Chính sách Bảo mật của mình theo thời gian. Chúng tôi sẽ thông báo 
              cho bạn về bất kỳ thay đổi nào bằng cách đăng Chính sách Bảo mật mới trên trang này và cập nhật 
              "ngày cập nhật lần cuối" ở đầu Chính sách Bảo mật này.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">9. Liên hệ</h2>
            <p>
              Nếu bạn có bất kỳ câu hỏi nào về Chính sách Bảo mật này, vui lòng liên hệ với chúng tôi:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Email: 
                <a href="mailto:privacy@viegym.com" className="text-orange-600 hover:text-orange-700 underline ml-1">
                  privacy@viegym.com
                </a>
              </li>
              <li>Hotline: 1900 xxxx</li>
            </ul>
          </section>
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <NavLink
            to="/auth/register"
            className="text-orange-600 hover:text-orange-700 font-medium"
          >
            ← Quay lại đăng ký
          </NavLink>
        </div>
      </div>
    </div>
  );
}
