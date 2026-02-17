import { useCallback, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { NavLink, useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../store/hooks";
import { useSelector } from "react-redux";
import { registerUser, selectAuth } from "../../store/features/auth/authSlice";
import PasswordInput from "../../components/PasswordInput";
import GoogleSignIn from "../../components/ButtonGoogle/GoogleSignIn";
import type { RegisterFormValues } from "./Types";

const RegisterPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading } = useSelector(selectAuth);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [apiError, setApiError] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    watch,
  } = useForm<RegisterFormValues>({
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = useCallback(
    async (data: RegisterFormValues) => {
      setApiError("");
      const { confirmPassword, ...registerData } = data;
      const resultAction = await dispatch(registerUser(registerData));

      if (registerUser.fulfilled.match(resultAction)) {
        console.log("Register successful:", resultAction.payload);
        alert("Đăng ký thành công! Vui lòng đăng nhập.");
        navigate("/auth/login");
      } else {
        console.error("Register failed:", resultAction.payload);
        setApiError(resultAction.payload as string || "Đăng ký thất bại");
      }
    },
    [dispatch, navigate]
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        {/* Logo và Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-gray-900 to-gray-700 dark:from-blue-500 dark:to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z"/>
              </svg>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              VieGym
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Tạo tài khoản mới
          </h1>
          <p className="text-gray-500 text-sm">Đăng ký để bắt đầu</p>
        </div>

        {/* API Error Message */}
        {apiError && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg shadow-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-red-800">{apiError}</p>
              </div>
              <button
                onClick={() => setApiError("")}
                className="ml-auto flex-shrink-0 inline-flex text-red-400 hover:text-red-600 focus:outline-none transition-colors"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <div>
          {/* Họ và tên */}
          <div className="mb-4">
            <input
              id="fullName"
              type="text"
              placeholder="Họ và tên"
              autoComplete="name"
              className={`h-12 w-full border rounded-lg px-4 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                errors.fullName ? "border-red-500" : "border-gray-300"
              }`}
              {...register("fullName", {
                required: "Vui lòng nhập họ và tên",
                minLength: {
                  value: 2,
                  message: "Họ và tên phải có ít nhất 2 ký tự"
                }
              })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  document.getElementById('email')?.focus();
                }
              }}
            />
            {errors.fullName && (
              <p className="text-red-500 text-xs mt-1">
                {errors.fullName.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="mb-4">
            <input
              id="email"
              type="email"
              placeholder="Email"
              autoComplete="off"
              className={`h-12 w-full border rounded-lg px-4 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                errors.email ? "border-red-500" : "border-gray-300"
              }`}
              {...register("email", {
                required: "Vui lòng nhập email",
                pattern: {
                  value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                  message: "Email không hợp lệ",
                },
              })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  document.getElementById('password')?.focus();
                }
              }}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="mb-4">
            <Controller
              name="password"
              control={control}
              rules={{ 
                required: "Vui lòng nhập mật khẩu",
                minLength: {
                  value: 6,
                  message: "Mật khẩu phải có ít nhất 6 ký tự"
                }
              }}
              render={({ field }) => (
                <PasswordInput
                  id="password"
                  placeholder="Mật khẩu"
                  innerRef={field.ref}
                  isInvalid={!!errors.password}
                  value={field.value || ""}
                  onChange={field.onChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      document.getElementById('confirmPassword')?.focus();
                    }
                  }}
                />
              )}
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="mb-4">
            <Controller
              name="confirmPassword"
              control={control}
              rules={{ 
                required: "Vui lòng xác nhận mật khẩu",
                validate: (value) => 
                  value === watch("password") || "Mật khẩu xác nhận không khớp"
              }}
              render={({ field }) => (
                <PasswordInput
                  id="confirmPassword"
                  placeholder="Xác nhận mật khẩu"
                  innerRef={field.ref}
                  isInvalid={!!errors.confirmPassword}
                  value={field.value || ""}
                  onChange={field.onChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && agreeTerms && !isLoading) {
                      e.preventDefault();
                      handleSubmit(onSubmit)();
                    }
                  }}
                />
              )}
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Sign Up Button */}
          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={isLoading || !agreeTerms}
            className={`w-full font-semibold py-3 rounded-lg transition-colors text-white mb-4 uppercase tracking-wide ${
              isLoading || !agreeTerms
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-orange-500 hover:bg-orange-600"
            }`}
          >
            {isLoading ? "ĐANG TẠO TÀI KHOẢN..." : "Đăng ký"}
          </button>

          {/* Terms & Conditions */}
          <div className="mb-6">
            <label className="flex items-start cursor-pointer">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="w-4 h-4 mt-0.5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
              />
              <span className="ml-2 text-xs text-gray-600">
                Bằng cách đăng ký, bạn đồng ý với{" "}
                <NavLink to="/auth/terms" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:text-orange-700 underline">
                  Điều khoản & Điều kiện
                </NavLink>
                {" "}và{" "}
                <NavLink to="/auth/privacy" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:text-orange-700 underline">
                  Chính sách Bảo mật của chúng tôi
                </NavLink>
              </span>
            </label>
          </div>

 
          {/* Google Sign-in */}
          <GoogleSignIn />

          {/* Sign In Link */}
          <div className="text-center mt-6">
            <span className="text-gray-600 text-sm">Bạn đã có tài khoản? </span>
            <NavLink to="/auth/login" className="text-orange-600 hover:text-orange-700 font-medium text-sm">
              Đăng nhập
            </NavLink>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;