import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import banner from "../../assets/images/banner.jpg";
import { 
  Dumbbell, 
  TrendingUp, 
  Users, 
  Target, 
  Calendar, 
  Award, 
  CheckCircle2,
  BarChart3,
  Sparkles,
  Clock,
  Heart,
  Zap
} from "lucide-react";

export default function LandingPage() {
  const features = [
    {
      icon: <Dumbbell className="w-12 h-12 text-orange-500" />,
      title: "Hướng dẫn 3D chuyên nghiệp",
      desc: "Mô hình 3D chi tiết từng cơ bắp, giúp bạn hiểu rõ kỹ thuật và tránh chấn thương hiệu quả."
    },
    {
      icon: <Target className="w-12 h-12 text-orange-500" />,
      title: "Bài tập cá nhân hóa",
      desc: "AI gợi ý lộ trình riêng theo mục tiêu, trình độ và thể trạng của bạn."
    },
    {
      icon: <BarChart3 className="w-12 h-12 text-orange-500" />,
      title: "Theo dõi tiến trình",
      desc: "Ghi nhận mọi buổi tập, biểu đồ chi tiết giúp bạn nhìn thấy sự thay đổi rõ ràng."
    },
    {
      icon: <Users className="w-12 h-12 text-orange-500" />,
      title: "Cộng đồng năng động",
      desc: "Kết nối với người đồng hành, chia sẻ thành tựu và động lực mỗi ngày."
    }
  ];

  const benefits = [
    {
      icon: <CheckCircle2 className="w-6 h-6 text-orange-500" />,
      text: "Thư viện 500+ bài tập với video hướng dẫn chi tiết"
    },
    {
      icon: <CheckCircle2 className="w-6 h-6 text-orange-500" />,
      text: "Lộ trình tập luyện theo từng mục tiêu: giảm cân, tăng cơ, tăng sức bền"
    },
    {
      icon: <CheckCircle2 className="w-6 h-6 text-orange-500" />,
      text: "Tính toán dinh dưỡng và kế hoạch ăn uống khoa học"
    },
    {
      icon: <CheckCircle2 className="w-6 h-6 text-orange-500" />,
      text: "Theo dõi số đo cơ thể, cân nặng qua từng giai đoạn"
    },
    {
      icon: <CheckCircle2 className="w-6 h-6 text-orange-500" />,
      text: "Nhắc nhở thông minh để duy trì thói quen tập luyện"
    },
    {
      icon: <CheckCircle2 className="w-6 h-6 text-orange-500" />,
      text: "Hỗ trợ 24/7 từ cộng đồng và chuyên gia"
    }
  ];

  const stats = [
    { number: "10,000+", label: "Người dùng", icon: <Users className="w-8 h-8" /> },
    { number: "500+", label: "Bài tập", icon: <Dumbbell className="w-8 h-8" /> },
    { number: "50,000+", label: "Buổi tập", icon: <Calendar className="w-8 h-8" /> },
    { number: "4.9/5", label: "Đánh giá", icon: <Award className="w-8 h-8" /> }
  ];

  const howItWorks = [
    {
      step: "01",
      icon: <Sparkles className="w-10 h-10 text-orange-500" />,
      title: "Đăng ký & Thiết lập mục tiêu",
      desc: "Tạo tài khoản trong 30 giây, chọn mục tiêu và trình độ của bạn"
    },
    {
      step: "02",
      icon: <Target className="w-10 h-10 text-orange-500" />,
      title: "Nhận lộ trình cá nhân",
      desc: "AI tạo kế hoạch tập luyện phù hợp 100% với bạn"
    },
    {
      step: "03",
      icon: <Zap className="w-10 h-10 text-orange-500" />,
      title: "Bắt đầu tập luyện",
      desc: "Theo dõi video 3D, ghi nhận tiến trình và nhận động lực từ cộng đồng"
    },
    {
      step: "04",
      icon: <TrendingUp className="w-10 h-10 text-orange-500" />,
      title: "Đạt mục tiêu",
      desc: "Nhìn thấy kết quả rõ rệt, chia sẻ thành công và truyền cảm hứng"
    }
  ];

  const testimonials = [
    {
      name: "Minh Anh",
      role: "Giảm 15kg trong 4 tháng",
      text: "VieGym đã thay đổi cuộc sống tôi! Lộ trình rõ ràng, cộng đồng nhiệt tình. Tôi đã đạt mục tiêu và giờ đang giữ dáng dễ dàng.",
      rating: 5
    },
    {
      name: "Tuấn Anh",
      role: "Tăng 8kg cơ bắp",
      text: "Video 3D siêu chi tiết, giúp tôi hiểu đúng kỹ thuật. Sau 6 tháng, cơ bắp rõ nét, sức khỏe tốt hơn hẳn!",
      rating: 5
    },
    {
      name: "Thu Hà",
      role: "Duy trì thói quen 1 năm",
      text: "Lần đầu tiên tôi giữ được thói quen tập luyện lâu đến vậy. App nhắc nhở thông minh, cộng đồng luôn động viên!",
      rating: 5
    }
  ];

  return (
    <div className="bg-black text-white min-h-screen overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col justify-center items-center text-center">
        <img
          src={banner}
          alt="Viegym Banner"
          className="absolute inset-0 w-full h-full object-cover opacity-30 blur-[2px]"
        />

        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        >
          <source src="/assets/videos/fitness-bg.mp4" type="video/mp4" />
        </video>

        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black"></div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="relative z-10 max-w-[1920px] w-full px-6 py-20"
        >
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="mb-6"
            >
              <span className="inline-block bg-orange-500/20 border border-orange-500/50 text-orange-400 px-4 py-2 rounded-full text-sm font-semibold mb-8">
                #1 Nền tảng thể hình tại Việt Nam
              </span>
            </motion.div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold leading-tight mb-6">
              <span className="text-orange-500">VieGym</span>
              <br />
              <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Luyện tập. Theo dõi. Thay đổi.
              </span>
            </h1>
            
            <p className="text-gray-300 text-lg md:text-2xl mb-10 max-w-3xl mx-auto leading-relaxed">
              Nền tảng thể hình toàn diện với <span className="text-orange-500 font-semibold">hướng dẫn 3D</span>, 
              <span className="text-orange-500 font-semibold"> lộ trình cá nhân hóa</span> và 
              <span className="text-orange-500 font-semibold"> cộng đồng năng động</span>. 
              Bắt đầu hành trình thay đổi của bạn ngay hôm nay!
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
              <Link
                to="/auth/register"
                className="bg-orange-500 hover:bg-orange-600 text-black px-10 py-4 rounded-xl font-bold text-lg transition transform hover:scale-105 shadow-lg shadow-orange-500/50 hover:shadow-orange-500/70"
              >
                Dùng thử miễn phí 7 ngày
              </Link>
              <Link
                to="/auth/login"
                className="border-2 border-orange-500 hover:bg-orange-500/10 px-10 py-4 rounded-xl font-bold text-lg transition transform hover:scale-105 backdrop-blur-sm"
              >
                Đăng nhập
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span>Không cần thẻ tín dụng</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span>Hủy bất cứ lúc nào</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span>10,000+ người dùng tin tưởng</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
        >
          <div className="w-6 h-10 border-2 border-orange-500/50 rounded-full flex justify-center pt-2">
            <div className="w-1 h-3 bg-orange-500 rounded-full"></div>
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="text-center"
              >
                <div className="flex justify-center mb-3 text-orange-500">
                  {stat.icon}
                </div>
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Tại sao chọn <span className="text-orange-500">VieGym</span>?
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Tất cả những gì bạn cần để đạt được mục tiêu thể hình trong một nền tảng
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 hover:border-orange-500/50 p-8 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/20 group"
              >
                <div className="flex justify-center mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-center group-hover:text-orange-500 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed text-center text-sm">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-6 bg-black">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Cách <span className="text-orange-500">hoạt động</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              4 bước đơn giản để bắt đầu hành trình thay đổi
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.2 }}
                viewport={{ once: true }}
                className="relative"
              >
                {/* Step number badge */}
                <div className="absolute -top-4 -left-4 w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center font-bold text-2xl text-black shadow-lg">
                  {step.step}
                </div>
                
                <div className="bg-gray-900 border border-gray-800 p-8 pt-12 rounded-2xl h-full hover:border-orange-500/50 transition-all">
                  <div className="flex justify-center mb-6">
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-orange-500">
                    {step.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
                
                {/* Connector line */}
                {idx < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-orange-500 to-transparent"></div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 px-6 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Mọi thứ bạn cần để <span className="text-orange-500">thành công</span>
              </h2>
              <p className="text-gray-400 text-lg mb-8">
                VieGym cung cấp đầy đủ công cụ, kiến thức và hỗ trợ để bạn đạt được mục tiêu thể hình một cách hiệu quả nhất.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-start gap-3 bg-gray-900/50 p-4 rounded-lg border border-gray-800 hover:border-orange-500/30 transition-all"
                  >
                    {benefit.icon}
                    <span className="text-gray-300">{benefit.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative bg-gradient-to-br from-orange-500/20 to-transparent p-8 rounded-3xl border border-orange-500/30">
                <div className="absolute -top-6 -right-6 w-32 h-32 bg-orange-500/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-orange-500/20 rounded-full blur-3xl"></div>
                
                <div className="relative bg-gray-900 p-8 rounded-2xl border border-gray-800">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center">
                      <Heart className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">Miễn phí 7 ngày</div>
                      <div className="text-gray-400">Trải nghiệm đầy đủ tính năng</div>
                    </div>
                  </div>
                  
                  <div className="space-y-4 text-gray-300">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-orange-500" />
                      <span>Truy cập không giới hạn</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Zap className="w-5 h-5 text-orange-500" />
                      <span>Không cần thẻ tín dụng</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-orange-500" />
                      <span>Hủy bất cứ lúc nào</span>
                    </div>
                  </div>

                  <Link
                    to="/auth/register"
                    className="mt-6 block w-full bg-orange-500 hover:bg-orange-600 text-center text-black px-6 py-4 rounded-xl font-bold transition transform hover:scale-105"
                  >
                    Bắt đầu ngay →
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 px-6 bg-black">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Câu chuyện <span className="text-orange-500">thành công</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Hàng ngàn người đã thay đổi cuộc sống với VieGym
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="bg-gray-900 border border-gray-800 p-8 rounded-2xl hover:border-orange-500/50 transition-all"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                
                <p className="text-gray-300 mb-6 leading-relaxed italic">
                  "{testimonial.text}"
                </p>
                
                <div>
                  <div className="font-bold text-white">{testimonial.name}</div>
                  <div className="text-sm text-orange-500">{testimonial.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-32 px-6 bg-gradient-to-b from-gray-900 to-black relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-transparent to-orange-500/10"></div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center relative z-10"
        >
          <div className="inline-block mb-6">
            <Sparkles className="w-16 h-16 text-orange-500 animate-pulse" />
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Sẵn sàng để <span className="text-orange-500">thay đổi</span> bản thân?
          </h2>
          
          <p className="text-gray-400 text-xl mb-12 max-w-2xl mx-auto">
            Tham gia cùng <span className="text-orange-500 font-semibold">10,000+</span> người dùng 
            đang đạt được mục tiêu fitness mỗi ngày
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-10">
            <Link
              to="/auth/register"
              className="bg-orange-500 hover:bg-orange-600 text-black px-12 py-5 rounded-xl text-xl font-bold transition transform hover:scale-105 shadow-2xl shadow-orange-500/50 inline-flex items-center justify-center gap-2"
            >
              Dùng thử miễn phí 7 ngày
              <Zap className="w-6 h-6" />
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Không cần thẻ tín dụng</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Hủy bất cứ lúc nào</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Hỗ trợ 24/7</span>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}

