import { NavLink } from "react-router-dom";

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Điều khoản & Điều kiện
          </h1>
          <p className="text-gray-500 text-sm">
            Cập nhật lần cuối: Tháng 12, 2025
          </p>
        </div>

        {/* Content */}
        <div className="prose max-w-none text-gray-700 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">1. Chấp nhận điều khoản</h2>
            <p>
              Bằng cách truy cập và sử dụng VieGym, bạn chấp nhận và đồng ý bị ràng buộc bởi các điều khoản 
              và điều kiện của thỏa thuận này. Nếu bạn không đồng ý với bất kỳ phần nào của các điều khoản này, 
              vui lòng không sử dụng dịch vụ của chúng tôi.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">2. Sử dụng dịch vụ</h2>
            <p>
              VieGym cung cấp nền tảng quản lý luyện tập và dinh dưỡng. Bạn đồng ý sử dụng dịch vụ chỉ cho 
              các mục đích hợp pháp và theo cách không vi phạm quyền của người khác hoặc hạn chế hoặc ngăn 
              cản việc sử dụng và hưởng thú của người khác đối với dịch vụ.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">3. Tài khoản người dùng</h2>
            <p>
              Khi tạo tài khoản với chúng tôi, bạn phải cung cấp thông tin chính xác, đầy đủ và cập nhật. 
              Việc không làm như vậy cấu thành vi phạm Điều khoản. Bạn có trách nhiệm bảo mật mật khẩu 
              tài khoản của mình và cho tất cả các hoạt động diễn ra dưới tài khoản của bạn.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">4. Quyền sở hữu trí tuệ</h2>
            <p>
              Dịch vụ và nội dung gốc của nó, tính năng và chức năng là và sẽ vẫn là tài sản độc quyền 
              của VieGym và các nhà cấp phép của nó. Dịch vụ được bảo vệ bởi bản quyền, thương hiệu 
              và các luật khác của cả Việt Nam và các quốc gia khác.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">5. Chấm dứt</h2>
            <p>
              Chúng tôi có thể chấm dứt hoặc tạm ngưng quyền truy cập vào Dịch vụ của bạn ngay lập tức, 
              không cần thông báo trước hoặc chịu trách nhiệm, vì bất kỳ lý do gì, bao gồm nhưng không 
              giới hạn nếu bạn vi phạm Điều khoản.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">6. Giới hạn trách nhiệm</h2>
            <p>
              Trong mọi trường hợp, VieGym, các giám đốc, nhân viên, đối tác, đại lý, nhà cung cấp 
              hoặc các chi nhánh sẽ không chịu trách nhiệm về bất kỳ thiệt hại gián tiếp, ngẫu nhiên, 
              đặc biệt, hậu quả hoặc trừng phạt nào.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">7. Thay đổi điều khoản</h2>
            <p>
              Chúng tôi có quyền, theo quyết định riêng của mình, sửa đổi hoặc thay thế các Điều khoản này 
              bất cứ lúc nào. Nếu một sửa đổi là trọng yếu, chúng tôi sẽ cung cấp thông báo ít nhất 30 ngày 
              trước khi các điều khoản mới có hiệu lực.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">8. Liên hệ</h2>
            <p>
              Nếu bạn có bất kỳ câu hỏi nào về Điều khoản này, vui lòng liên hệ với chúng tôi qua email: 
              <a href="mailto:support@viegym.com" className="text-orange-600 hover:text-orange-700 underline ml-1">
                support@viegym.com
              </a>
            </p>
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
