import { useCallback, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { NavLink, useNavigate, useSearchParams } from "react-router-dom";
import PasswordInput from "../../components/PasswordInput";
import GoogleSignIn from "../../components/ButtonGoogle/GoogleSignIn";
import { useAppDispatch } from "../../store/hooks";
import { loginUser, selectAuth } from "../../store/features/auth/authSlice";
import type { LoginFormValues } from "./Types";

const LoginPage= () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading } = useSelector(selectAuth);
  const [searchParams, setSearchParams] = useSearchParams();
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string>("");
  const [keepSignedIn, setKeepSignedIn] = useState(false);

  // Kiểm tra error từ OAuth2 callback
  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      setOauthError(decodeURIComponent(error));
      // Xóa error từ URL để không hiển thị lại khi refresh
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    control,
  } = useForm<LoginFormValues>({
    mode: "onChange",
    defaultValues: { email: "", password: "" },
  });

  // Submit form
  const onSubmit = useCallback(
    async (data: LoginFormValues) => {
      try {
        setLoginError("");
        // Thêm rememberMe vào data
        const loginData = { ...data, rememberMe: keepSignedIn };
        const resultAction = await dispatch(loginUser(loginData));
        if (loginUser.fulfilled.match(resultAction)) {
          const payload = resultAction.payload;
          const roles = Array.isArray(payload.roles) ? payload.roles : [];
          const normalizedRoles = roles
            .filter((role): role is string => typeof role === "string")
            .map((role) => role.trim().toUpperCase());

          const hasAdminRole = normalizedRoles.some(
            (role) => role === "ROLE_ADMIN" || role === "ADMIN" || role === "ROLE_SUPER_ADMIN"
          );
          
          const hasCoachRole = normalizedRoles.some(
            (role) => role === "ROLE_COACH" || role === "COACH"
          );

          console.log("Login successful:", payload);
          
          if (hasAdminRole) {
            navigate("/admin");
          } else if (hasCoachRole) {
            navigate("/coach");
          } else {
            navigate("/");
          }
        } else {
          console.error("Login failed:", resultAction.payload);
          setLoginError(resultAction.payload as string || "Đăng nhập thất bại");
        }
      } catch (error) {
        console.error("Unexpected error:", error);
        setLoginError("Đã xảy ra lỗi. Vui lòng thử lại.");
      }
    },
    [dispatch, navigate, keepSignedIn]
  );

  const handlePasswordReminder = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    navigate("/auth/forgot-password");
  };

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
            Xin chào! Hãy bắt đầu nào
          </h1>
          <p className="text-gray-500 text-sm">Đăng nhập để tiếp tục.</p>
        </div>

        <div onSubmit={handleSubmit(onSubmit)}>
          {/* Login Error Message */}
          {loginError && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg shadow-sm">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-red-800">{loginError}</p>
                </div>
                <button
                  onClick={() => setLoginError("")}
                  className="ml-auto flex-shrink-0 inline-flex text-red-400 hover:text-red-600 focus:outline-none transition-colors"
                >
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* OAuth2 Error Message */}
          {oauthError && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg shadow-sm">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-semibold text-red-800">Đăng nhập Google thất bại</p>
                  <p className="text-xs text-red-700 mt-1">{oauthError}</p>
                </div>
              </div>
            </div>
          )}

          {/* Username/Email */}
          <div className="mb-4">
            <input
              id="email"
              type="email"
              placeholder="Email"
              className={`h-12 w-full border rounded-lg px-4 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${errors.email ? "border-red-500" : "border-gray-300"
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
              <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="mb-4">
            <Controller
              name="password"
              control={control}
              rules={{ required: "Vui lòng nhập mật khẩu" }}
              render={({ field }) => (
                <PasswordInput
                  id="password"
                  placeholder="Mật khẩu"
                  innerRef={field.ref}
                  isInvalid={!!errors.password}
                  value={field.value}
                  onChange={field.onChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && isValid && !isLoading) {
                      e.preventDefault();
                      handleSubmit(onSubmit)();
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

          {/* Sign In Button */}
          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            className={`w-full font-semibold py-3 rounded-lg transition-colors text-white mb-4 uppercase tracking-wide ${
              isLoading || !isValid
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-orange-500 hover:bg-orange-600"
            }`}
            disabled={isLoading || !isValid}
          >
            {isLoading ? "ĐANG ĐĂNG NHẬP..." : "Đăng nhập"}
          </button>

          {/* Keep me signed in & Forgot password */}
          <div className="flex items-center justify-between mb-6">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={keepSignedIn}
                onChange={(e) => setKeepSignedIn(e.target.checked)}
                className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
              />
              <span className="ml-2 text-sm text-gray-600">Lưu đăng nhập cho lần sau</span>
            </label>
            <a
              href="#"
              onClick={handlePasswordReminder}
              className="text-sm text-gray-700 hover:text-orange-600 underline"
            >
              Quên mật khẩu?
            </a>
          </div>

          {/* Google Connect */}
          <GoogleSignIn />

          {/* Create Account Link */}
          <div className="text-center mt-6">
            <span className="text-gray-600 text-sm">Bạn chưa có tài khoản? </span>
            <NavLink to="/auth/register" className="text-orange-500 hover:text-orange-600 font-medium text-sm">
              <span>Tạo tài khoản ngay</span>
            </NavLink>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;