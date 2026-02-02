# Supabase 이메일 템플릿 설정 가이드

회원가입 시 사용자가 선택한 언어에 맞게 인증 메일을 발송하려면 Supabase 대시보드에서 이메일 템플릿을 수정해야 합니다.

## 설정 위치

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택
3. **Authentication** → **Email Templates** 이동

## Confirm signup (회원가입 확인 메일)

### Subject (제목)

```
{{ if eq .Data.language "ko" }}gwanggo 이메일 인증{{ else if eq .Data.language "ja" }}gwanggo メール認証{{ else if eq .Data.language "zh" }}gwanggo 邮箱验证{{ else }}Confirm your gwanggo account{{ end }}
```

### Body (HTML)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f9fafb;
    }
    .container {
      background-color: #ffffff;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }
    .logo {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo img {
      height: 36px;
      width: auto;
    }
    h1 {
      color: #111827;
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 16px;
      text-align: center;
    }
    p {
      color: #6b7280;
      font-size: 16px;
      margin-bottom: 24px;
      text-align: center;
    }
    .button {
      display: block;
      width: 100%;
      max-width: 280px;
      margin: 0 auto 24px;
      padding: 14px 24px;
      background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      text-align: center;
    }
    .button:hover {
      background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
    }
    .footer {
      text-align: center;
      color: #9ca3af;
      font-size: 14px;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
    }
    .link-text {
      word-break: break-all;
      color: #8b5cf6;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <img src="{{ .SiteURL }}/logo-full-dark-lg.png" alt="gwanggo" />
    </div>

    {{ if eq .Data.language "ko" }}
    <h1>이메일 인증</h1>
    <p>gwanggo에 가입해 주셔서 감사합니다!<br>아래 버튼을 클릭하여 이메일 주소를 인증해 주세요.</p>
    <a href="{{ .ConfirmationURL }}" class="button">이메일 인증하기</a>
    <p style="font-size: 14px;">버튼이 작동하지 않으면 아래 링크를 복사하여 브라우저에 붙여넣으세요:</p>
    <p class="link-text">{{ .ConfirmationURL }}</p>
    <div class="footer">
      <p>이 링크는 24시간 동안 유효합니다.</p>
      <p>본인이 요청하지 않은 경우 이 이메일을 무시해 주세요.</p>
    </div>

    {{ else if eq .Data.language "ja" }}
    <h1>メール認証</h1>
    <p>gwanggoにご登録いただきありがとうございます！<br>下のボタンをクリックしてメールアドレスを認証してください。</p>
    <a href="{{ .ConfirmationURL }}" class="button">メールを認証する</a>
    <p style="font-size: 14px;">ボタンが機能しない場合は、以下のリンクをコピーしてブラウザに貼り付けてください：</p>
    <p class="link-text">{{ .ConfirmationURL }}</p>
    <div class="footer">
      <p>このリンクは24時間有効です。</p>
      <p>このメールに心当たりがない場合は無視してください。</p>
    </div>

    {{ else if eq .Data.language "zh" }}
    <h1>邮箱验证</h1>
    <p>感谢您注册gwanggo！<br>请点击下方按钮验证您的邮箱地址。</p>
    <a href="{{ .ConfirmationURL }}" class="button">验证邮箱</a>
    <p style="font-size: 14px;">如果按钮无法使用，请复制以下链接并粘贴到浏览器中：</p>
    <p class="link-text">{{ .ConfirmationURL }}</p>
    <div class="footer">
      <p>此链接24小时内有效。</p>
      <p>如果您没有请求此邮件，请忽略。</p>
    </div>

    {{ else }}
    <h1>Verify your email</h1>
    <p>Thanks for signing up for gwanggo!<br>Please click the button below to verify your email address.</p>
    <a href="{{ .ConfirmationURL }}" class="button">Verify Email</a>
    <p style="font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
    <p class="link-text">{{ .ConfirmationURL }}</p>
    <div class="footer">
      <p>This link is valid for 24 hours.</p>
      <p>If you didn't request this email, you can safely ignore it.</p>
    </div>
    {{ end }}
  </div>
</body>
</html>
```

## Magic Link (매직 링크 로그인)

### Subject

```
{{ if eq .Data.language "ko" }}gwanggo 로그인 링크{{ else if eq .Data.language "ja" }}gwanggo ログインリンク{{ else if eq .Data.language "zh" }}gwanggo 登录链接{{ else }}Your gwanggo login link{{ end }}
```

### Body (HTML)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f9fafb;
    }
    .container {
      background-color: #ffffff;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }
    .logo {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo img {
      height: 36px;
      width: auto;
    }
    h1 {
      color: #111827;
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 16px;
      text-align: center;
    }
    p {
      color: #6b7280;
      font-size: 16px;
      margin-bottom: 24px;
      text-align: center;
    }
    .button {
      display: block;
      width: 100%;
      max-width: 280px;
      margin: 0 auto 24px;
      padding: 14px 24px;
      background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      text-align: center;
    }
    .footer {
      text-align: center;
      color: #9ca3af;
      font-size: 14px;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
    }
    .link-text {
      word-break: break-all;
      color: #8b5cf6;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <img src="{{ .SiteURL }}/logo-full-dark-lg.png" alt="gwanggo" />
    </div>

    {{ if eq .Data.language "ko" }}
    <h1>로그인 링크</h1>
    <p>아래 버튼을 클릭하여 gwanggo에 로그인하세요.</p>
    <a href="{{ .ConfirmationURL }}" class="button">로그인하기</a>
    <p style="font-size: 14px;">버튼이 작동하지 않으면 아래 링크를 복사하여 브라우저에 붙여넣으세요:</p>
    <p class="link-text">{{ .ConfirmationURL }}</p>
    <div class="footer">
      <p>이 링크는 1시간 동안 유효합니다.</p>
      <p>본인이 요청하지 않은 경우 이 이메일을 무시해 주세요.</p>
    </div>

    {{ else if eq .Data.language "ja" }}
    <h1>ログインリンク</h1>
    <p>下のボタンをクリックしてgwanggoにログインしてください。</p>
    <a href="{{ .ConfirmationURL }}" class="button">ログインする</a>
    <p style="font-size: 14px;">ボタンが機能しない場合は、以下のリンクをコピーしてブラウザに貼り付けてください：</p>
    <p class="link-text">{{ .ConfirmationURL }}</p>
    <div class="footer">
      <p>このリンクは1時間有効です。</p>
      <p>このメールに心当たりがない場合は無視してください。</p>
    </div>

    {{ else if eq .Data.language "zh" }}
    <h1>登录链接</h1>
    <p>请点击下方按钮登录gwanggo。</p>
    <a href="{{ .ConfirmationURL }}" class="button">登录</a>
    <p style="font-size: 14px;">如果按钮无法使用，请复制以下链接并粘贴到浏览器中：</p>
    <p class="link-text">{{ .ConfirmationURL }}</p>
    <div class="footer">
      <p>此链接1小时内有效。</p>
      <p>如果您没有请求此邮件，请忽略。</p>
    </div>

    {{ else }}
    <h1>Login Link</h1>
    <p>Click the button below to log in to gwanggo.</p>
    <a href="{{ .ConfirmationURL }}" class="button">Log In</a>
    <p style="font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
    <p class="link-text">{{ .ConfirmationURL }}</p>
    <div class="footer">
      <p>This link is valid for 1 hour.</p>
      <p>If you didn't request this email, you can safely ignore it.</p>
    </div>
    {{ end }}
  </div>
</body>
</html>
```

## Reset Password (비밀번호 재설정)

### Subject

```
{{ if eq .Data.language "ko" }}gwanggo 비밀번호 재설정{{ else if eq .Data.language "ja" }}gwanggo パスワードリセット{{ else if eq .Data.language "zh" }}gwanggo 重置密码{{ else }}Reset your gwanggo password{{ end }}
```

### Body (HTML)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f9fafb;
    }
    .container {
      background-color: #ffffff;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }
    .logo {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo img {
      height: 36px;
      width: auto;
    }
    h1 {
      color: #111827;
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 16px;
      text-align: center;
    }
    p {
      color: #6b7280;
      font-size: 16px;
      margin-bottom: 24px;
      text-align: center;
    }
    .button {
      display: block;
      width: 100%;
      max-width: 280px;
      margin: 0 auto 24px;
      padding: 14px 24px;
      background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      text-align: center;
    }
    .footer {
      text-align: center;
      color: #9ca3af;
      font-size: 14px;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
    }
    .link-text {
      word-break: break-all;
      color: #8b5cf6;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <img src="{{ .SiteURL }}/logo-full-dark-lg.png" alt="gwanggo" />
    </div>

    {{ if eq .Data.language "ko" }}
    <h1>비밀번호 재설정</h1>
    <p>비밀번호 재설정을 요청하셨습니다.<br>아래 버튼을 클릭하여 새 비밀번호를 설정하세요.</p>
    <a href="{{ .ConfirmationURL }}" class="button">비밀번호 재설정</a>
    <p style="font-size: 14px;">버튼이 작동하지 않으면 아래 링크를 복사하여 브라우저에 붙여넣으세요:</p>
    <p class="link-text">{{ .ConfirmationURL }}</p>
    <div class="footer">
      <p>이 링크는 1시간 동안 유효합니다.</p>
      <p>본인이 요청하지 않은 경우 이 이메일을 무시해 주세요.</p>
    </div>

    {{ else if eq .Data.language "ja" }}
    <h1>パスワードリセット</h1>
    <p>パスワードのリセットがリクエストされました。<br>下のボタンをクリックして新しいパスワードを設定してください。</p>
    <a href="{{ .ConfirmationURL }}" class="button">パスワードをリセット</a>
    <p style="font-size: 14px;">ボタンが機能しない場合は、以下のリンクをコピーしてブラウザに貼り付けてください：</p>
    <p class="link-text">{{ .ConfirmationURL }}</p>
    <div class="footer">
      <p>このリンクは1時間有効です。</p>
      <p>このメールに心当たりがない場合は無視してください。</p>
    </div>

    {{ else if eq .Data.language "zh" }}
    <h1>重置密码</h1>
    <p>您请求了密码重置。<br>请点击下方按钮设置新密码。</p>
    <a href="{{ .ConfirmationURL }}" class="button">重置密码</a>
    <p style="font-size: 14px;">如果按钮无法使用，请复制以下链接并粘贴到浏览器中：</p>
    <p class="link-text">{{ .ConfirmationURL }}</p>
    <div class="footer">
      <p>此链接1小时内有效。</p>
      <p>如果您没有请求此邮件，请忽略。</p>
    </div>

    {{ else }}
    <h1>Reset Password</h1>
    <p>You requested a password reset.<br>Click the button below to set a new password.</p>
    <a href="{{ .ConfirmationURL }}" class="button">Reset Password</a>
    <p style="font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
    <p class="link-text">{{ .ConfirmationURL }}</p>
    <div class="footer">
      <p>This link is valid for 1 hour.</p>
      <p>If you didn't request this email, you can safely ignore it.</p>
    </div>
    {{ end }}
  </div>
</body>
</html>
```

## 주의사항

1. **로고 이미지**: `{{ .SiteURL }}/logo-full-dark-lg.png`가 공개적으로 접근 가능해야 합니다.
2. **언어 감지**: 사용자가 회원가입 시 선택한 언어가 `user_metadata.language`에 저장됩니다.
3. **기본 언어**: 언어 정보가 없으면 영어(en)가 기본값입니다.
4. **테스트**: 템플릿 적용 후 각 언어로 테스트 이메일을 발송해 보세요.

## 코드 변경사항

회원가입 시 언어 정보가 자동으로 `user_metadata`에 저장됩니다:

```typescript
// app/(auth)/signup/page.tsx
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`,
    data: {
      language: language, // 'ko', 'en', 'ja', 'zh'
    },
  },
})
```
