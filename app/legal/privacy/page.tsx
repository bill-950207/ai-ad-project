/**
 * 개인정보처리방침 페이지
 */

'use client'

import Link from 'next/link'
import { useLanguage } from '@/contexts/language-context'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
  const { language } = useLanguage()

  const content = {
    ko: {
      title: '개인정보처리방침',
      lastUpdated: '최종 수정일: 2026년 1월 29일',
      backToHome: '홈으로 돌아가기',
      sections: [
        {
          title: '1. 개인정보의 수집 항목 및 수집 방법',
          content: `조코딩(이하 "회사")은 gwanggo 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다.

수집 항목:
- 필수: 이메일 주소, 비밀번호(암호화 저장)
- 선택: 프로필 이미지, 닉네임
- 자동 수집: 서비스 이용 기록, 접속 로그, 결제 기록

수집 방법:
- 회원가입 시 이용자가 직접 입력
- 서비스 이용 과정에서 자동 생성 및 수집
- 제3자 로그인(Google, Kakao) 시 해당 서비스로부터 제공`,
        },
        {
          title: '2. 개인정보의 수집 및 이용 목적',
          content: `회사는 수집한 개인정보를 다음의 목적으로 이용합니다:

- 회원 가입 및 관리: 회원제 서비스 제공, 본인 확인, 부정 이용 방지
- 서비스 제공: AI 콘텐츠 생성, 크레딧 관리, 결제 처리
- 서비스 개선: 서비스 이용 통계 분석, 신규 기능 개발
- 고객 지원: 문의 응대, 공지사항 전달
- 마케팅: 이벤트 및 프로모션 안내 (별도 동의 시)`,
        },
        {
          title: '3. 개인정보의 보유 및 이용 기간',
          content: `회사는 원칙적으로 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.

- 회원 정보: 회원 탈퇴 시 즉시 파기 (관련 법령에 따른 보존 기간 제외)
- 결제 정보: 전자상거래법에 따라 5년간 보존
- 서비스 이용 기록: 3년간 보존 후 파기
- 접속 로그: 통신비밀보호법에 따라 3개월간 보존`,
        },
        {
          title: '4. 개인정보의 제3자 제공',
          content: `회사는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다. 다만, 다음의 경우는 예외로 합니다:

- 이용자가 사전에 동의한 경우
- 법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우

서비스 제공을 위해 다음의 업체와 개인정보 처리를 위탁합니다:
- Supabase: 데이터베이스 및 인증 서비스
- Stripe: 결제 처리
- Cloudflare: 콘텐츠 저장 및 전송`,
        },
        {
          title: '5. 개인정보의 파기 절차 및 방법',
          content: `회사는 개인정보 보유 기간의 경과, 처리 목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다.

파기 절차:
- 이용자가 회원가입 등을 위해 입력한 정보는 목적이 달성된 후 별도의 DB로 옮겨져 내부 방침 및 기타 관련 법령에 의한 정보보호 사유에 따라 일정 기간 저장된 후 파기됩니다.

파기 방법:
- 전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제합니다.`,
        },
        {
          title: '6. 이용자의 권리와 행사 방법',
          content: `이용자는 언제든지 자신의 개인정보에 대해 다음의 권리를 행사할 수 있습니다:

- 개인정보 열람 요구
- 개인정보 정정 요구
- 개인정보 삭제 요구
- 개인정보 처리 정지 요구

권리 행사는 서비스 내 설정 페이지에서 직접 처리하거나, 고객센터를 통해 요청할 수 있습니다.`,
        },
        {
          title: '7. 쿠키(Cookie)의 사용',
          content: `회사는 이용자에게 맞춤 서비스를 제공하기 위해 쿠키를 사용합니다.

쿠키 사용 목적:
- 로그인 상태 유지
- 이용자 설정 저장 (언어, 테마 등)
- 서비스 이용 분석

쿠키 거부 방법:
- 웹 브라우저 설정에서 쿠키 저장을 거부할 수 있습니다.
- 다만, 쿠키 저장을 거부할 경우 일부 서비스 이용이 제한될 수 있습니다.`,
        },
        {
          title: '8. 개인정보의 안전성 확보 조치',
          content: `회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다:

- 비밀번호 암호화: 이용자의 비밀번호는 암호화되어 저장 및 관리됩니다.
- 해킹 등에 대비한 대책: SSL/TLS 암호화 통신을 사용합니다.
- 접근 권한 관리: 개인정보에 대한 접근 권한을 최소한의 인원으로 제한합니다.
- 개인정보 처리 시스템 접근 기록 보관: 최소 1년 이상 보관합니다.`,
        },
        {
          title: '9. 개인정보 보호책임자',
          content: `회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 이용자의 불만 처리 및 피해 구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.

개인정보 보호책임자:
- 이메일: privacy@jocoding.net

이용자는 서비스 이용 중 발생한 모든 개인정보 보호 관련 문의, 불만 처리, 피해 구제 등에 관한 사항을 개인정보 보호책임자에게 문의할 수 있습니다.`,
        },
        {
          title: '10. 개인정보처리방침의 변경',
          content: `이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경 내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.`,
        },
      ],
    },
    en: {
      title: 'Privacy Policy',
      lastUpdated: 'Last updated: January 29, 2026',
      backToHome: 'Back to Home',
      sections: [
        {
          title: '1. Collection of Personal Information',
          content: `Jocoding (the "Company") collects the following personal information to provide the gwanggo service.

Information Collected:
- Required: Email address, password (encrypted)
- Optional: Profile image, nickname
- Automatically collected: Service usage records, access logs, payment records

Collection Methods:
- Direct input by users during registration
- Automatic generation and collection during service use
- Provided by third-party login services (Google, Kakao)`,
        },
        {
          title: '2. Purpose of Collection and Use',
          content: `The Company uses collected personal information for the following purposes:

- Member management: Providing membership services, identity verification, preventing unauthorized use
- Service provision: AI content generation, credit management, payment processing
- Service improvement: Analyzing service usage statistics, developing new features
- Customer support: Responding to inquiries, delivering notices
- Marketing: Event and promotion notifications (with separate consent)`,
        },
        {
          title: '3. Retention Period',
          content: `The Company destroys personal information without delay after the purpose of collection and use has been achieved.

- Member information: Destroyed immediately upon withdrawal (except for legally required retention periods)
- Payment information: Retained for 5 years under e-commerce laws
- Service usage records: Retained for 3 years then destroyed
- Access logs: Retained for 3 months under telecommunications laws`,
        },
        {
          title: '4. Provision to Third Parties',
          content: `The Company does not provide personal information to third parties without user consent, except in the following cases:

- When users have given prior consent
- When required by law or requested by investigative agencies according to legal procedures

The following partners process personal information for service provision:
- Supabase: Database and authentication services
- Stripe: Payment processing
- Cloudflare: Content storage and delivery`,
        },
        {
          title: '5. Destruction of Personal Information',
          content: `The Company destroys personal information without delay when it is no longer needed due to expiration of retention period or achievement of purpose.

Destruction Procedure:
- Information entered for membership registration is moved to a separate DB after the purpose is achieved and destroyed after a certain period according to internal policies and information protection reasons under relevant laws.

Destruction Method:
- Electronic files are deleted using technical methods that prevent record regeneration.`,
        },
        {
          title: '6. User Rights',
          content: `Users may exercise the following rights regarding their personal information at any time:

- Request to view personal information
- Request to correct personal information
- Request to delete personal information
- Request to suspend processing of personal information

Rights can be exercised through the settings page within the service or by contacting customer support.`,
        },
        {
          title: '7. Use of Cookies',
          content: `The Company uses cookies to provide customized services to users.

Purpose of Cookies:
- Maintaining login status
- Saving user settings (language, theme, etc.)
- Analyzing service usage

How to Refuse Cookies:
- You can refuse cookie storage in your web browser settings.
- However, refusing cookies may limit some service use.`,
        },
        {
          title: '8. Security Measures',
          content: `The Company takes the following measures to ensure the security of personal information:

- Password encryption: User passwords are encrypted for storage and management.
- Security against hacking: SSL/TLS encrypted communication is used.
- Access control: Access to personal information is limited to minimum personnel.
- Access log retention: Retained for at least 1 year.`,
        },
        {
          title: '9. Privacy Officer',
          content: `The Company designates a Privacy Officer to handle personal information processing affairs and address user complaints and remedies related to personal information processing.

Privacy Officer:
- Email: privacy@jocoding.net

Users may contact the Privacy Officer for all inquiries, complaints, and remedies related to personal information protection during service use.`,
        },
        {
          title: '10. Changes to Privacy Policy',
          content: `This Privacy Policy is effective from the implementation date. In case of additions, deletions, and corrections according to laws and policies, changes will be announced through notices at least 7 days before implementation.`,
        },
      ],
    },
    ja: {
      title: 'プライバシーポリシー',
      lastUpdated: '最終更新日：2026年1月29日',
      backToHome: 'ホームに戻る',
      sections: [
        {
          title: '1. 個人情報の収集項目及び収集方法',
          content: `Jocoding（以下「当社」）はgwanggoサービス提供のため、以下の個人情報を収集します。

収集項目：
- 必須：メールアドレス、パスワード（暗号化保存）
- 任意：プロフィール画像、ニックネーム
- 自動収集：サービス利用記録、アクセスログ、決済記録

収集方法：
- 会員登録時に利用者が直接入力
- サービス利用過程で自動生成及び収集
- 第三者ログイン（Google、Kakao）時に当該サービスから提供`,
        },
        {
          title: '2. 個人情報の収集及び利用目的',
          content: `当社は収集した個人情報を以下の目的で利用します：

- 会員管理：会員制サービス提供、本人確認、不正利用防止
- サービス提供：AIコンテンツ生成、クレジット管理、決済処理
- サービス改善：サービス利用統計分析、新機能開発
- カスタマーサポート：お問い合わせ対応、お知らせ配信
- マーケティング：イベント及びプロモーション案内（別途同意時）`,
        },
        {
          title: '3. 個人情報の保有及び利用期間',
          content: `当社は原則として個人情報収集及び利用目的が達成された後は、当該情報を遅滞なく破棄します。

- 会員情報：退会時即時破棄（関連法令に基づく保存期間を除く）
- 決済情報：電子商取引法に基づき5年間保存
- サービス利用記録：3年間保存後破棄
- アクセスログ：通信秘密保護法に基づき3ヶ月間保存`,
        },
        {
          title: '4. 個人情報の第三者提供',
          content: `当社は利用者の同意なく個人情報を第三者に提供しません。ただし、以下の場合は例外とします：

- 利用者が事前に同意した場合
- 法令の規定に基づくか、捜査目的で法令に定められた手続きと方法に従い捜査機関の要求がある場合

サービス提供のため以下の業者と個人情報処理を委託します：
- Supabase：データベース及び認証サービス
- Stripe：決済処理
- Cloudflare：コンテンツ保存及び配信`,
        },
        {
          title: '5. 個人情報の破棄手続き及び方法',
          content: `当社は個人情報保有期間の経過、処理目的達成等により個人情報が不要になった場合は、遅滞なく当該個人情報を破棄します。

破棄手続き：
- 利用者が会員登録等のために入力した情報は、目的が達成された後、別途のDBに移され、内部方針及びその他関連法令による情報保護事由に従い一定期間保存された後破棄されます。

破棄方法：
- 電子的ファイル形態の情報は記録を再生できない技術的方法を使用して削除します。`,
        },
        {
          title: '6. 利用者の権利と行使方法',
          content: `利用者はいつでも自分の個人情報について以下の権利を行使できます：

- 個人情報閲覧要求
- 個人情報訂正要求
- 個人情報削除要求
- 個人情報処理停止要求

権利行使はサービス内の設定ページで直接処理するか、カスタマーセンターを通じて要請できます。`,
        },
        {
          title: '7. クッキー（Cookie）の使用',
          content: `当社は利用者にカスタマイズされたサービスを提供するためにクッキーを使用します。

クッキー使用目的：
- ログイン状態維持
- 利用者設定保存（言語、テーマ等）
- サービス利用分析

クッキー拒否方法：
- Webブラウザ設定でクッキー保存を拒否できます。
- ただし、クッキー保存を拒否する場合、一部サービス利用が制限される可能性があります。`,
        },
        {
          title: '8. 個人情報の安全性確保措置',
          content: `当社は個人情報の安全性確保のため以下の措置を講じています：

- パスワード暗号化：利用者のパスワードは暗号化して保存・管理されます。
- ハッキング等への対策：SSL/TLS暗号化通信を使用します。
- アクセス権限管理：個人情報へのアクセス権限を最小限の人員に制限します。
- 個人情報処理システムアクセス記録保管：最低1年以上保管します。`,
        },
        {
          title: '9. 個人情報保護責任者',
          content: `当社は個人情報処理に関する業務を総括して責任を負い、個人情報処理と関連した利用者の苦情処理及び被害救済等のため、以下のように個人情報保護責任者を指定しています。

個人情報保護責任者：
- メール：privacy@jocoding.net

利用者はサービス利用中に発生したすべての個人情報保護関連のお問い合わせ、苦情処理、被害救済等に関する事項を個人情報保護責任者にお問い合わせいただけます。`,
        },
        {
          title: '10. プライバシーポリシーの変更',
          content: `本プライバシーポリシーは施行日から適用され、法令及び方針による変更内容の追加、削除及び訂正がある場合は、変更事項の施行7日前からお知らせを通じて告知します。`,
        },
      ],
    },
    zh: {
      title: '隐私政策',
      lastUpdated: '最后更新：2026年1月29日',
      backToHome: '返回首页',
      sections: [
        {
          title: '1. 个人信息的收集项目及收集方式',
          content: `Jocoding（以下简称"公司"）为提供gwanggo服务，收集以下个人信息。

收集项目：
- 必填：电子邮箱、密码（加密存储）
- 选填：头像、昵称
- 自动收集：服务使用记录、访问日志、支付记录

收集方式：
- 用户注册时直接输入
- 服务使用过程中自动生成和收集
- 第三方登录（Google、Kakao）时由相关服务提供`,
        },
        {
          title: '2. 个人信息的收集及使用目的',
          content: `公司将收集的个人信息用于以下目的：

- 会员管理：提供会员服务、身份验证、防止非法使用
- 服务提供：AI内容生成、积分管理、支付处理
- 服务改进：分析服务使用统计、开发新功能
- 客户支持：回复咨询、发送通知
- 营销：活动及促销通知（需另行同意）`,
        },
        {
          title: '3. 个人信息的保留及使用期限',
          content: `公司原则上在个人信息收集及使用目的达成后立即销毁相关信息。

- 会员信息：退出时立即销毁（相关法律规定的保存期限除外）
- 支付信息：根据电子商务法保存5年
- 服务使用记录：保存3年后销毁
- 访问日志：根据通信秘密保护法保存3个月`,
        },
        {
          title: '4. 向第三方提供个人信息',
          content: `未经用户同意，公司不会向第三方提供个人信息。但以下情况除外：

- 用户事先同意的情况
- 根据法律规定，或应调查机关按法定程序和方法要求的情况

为提供服务，公司与以下合作方委托处理个人信息：
- Supabase：数据库及认证服务
- Stripe：支付处理
- Cloudflare：内容存储及传输`,
        },
        {
          title: '5. 个人信息的销毁程序及方法',
          content: `当个人信息保留期限届满、处理目的达成等不再需要个人信息时，公司将立即销毁相关个人信息。

销毁程序：
- 用户为注册会员等目的输入的信息，在目的达成后转移至单独的数据库，根据内部政策及相关法律的信息保护事由保存一定期限后销毁。

销毁方法：
- 电子文件形式的信息使用无法再生记录的技术方法删除。`,
        },
        {
          title: '6. 用户的权利及行使方法',
          content: `用户随时可以对自己的个人信息行使以下权利：

- 请求查阅个人信息
- 请求更正个人信息
- 请求删除个人信息
- 请求停止处理个人信息

权利行使可通过服务内的设置页面直接处理，或通过客服中心提出请求。`,
        },
        {
          title: '7. Cookie的使用',
          content: `公司为向用户提供定制服务而使用Cookie。

Cookie使用目的：
- 维持登录状态
- 保存用户设置（语言、主题等）
- 分析服务使用情况

拒绝Cookie的方法：
- 可在网络浏览器设置中拒绝保存Cookie。
- 但如果拒绝保存Cookie，部分服务使用可能会受到限制。`,
        },
        {
          title: '8. 个人信息安全保障措施',
          content: `公司为确保个人信息安全采取以下措施：

- 密码加密：用户密码加密存储和管理。
- 防范黑客攻击：使用SSL/TLS加密通信。
- 访问权限管理：将个人信息访问权限限制在最少人员范围内。
- 个人信息处理系统访问记录保管：至少保管1年以上。`,
        },
        {
          title: '9. 个人信息保护负责人',
          content: `公司指定个人信息保护负责人，全面负责个人信息处理相关业务，处理与个人信息处理相关的用户投诉及损害救济等。

个人信息保护负责人：
- 邮箱：privacy@jocoding.net

用户可就服务使用中发生的所有个人信息保护相关咨询、投诉处理、损害救济等事项联系个人信息保护负责人。`,
        },
        {
          title: '10. 隐私政策的变更',
          content: `本隐私政策自生效日起适用，如根据法律法规及政策有内容的增加、删除及修正，将在变更事项生效7天前通过公告通知。`,
        },
      ],
    },
  }

  const t = content[language as keyof typeof content] || content.ko

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.backToHome}</span>
          </Link>
        </div>
      </header>

      {/* 본문 */}
      <main className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-3xl font-bold text-foreground mb-2">{t.title}</h1>
        <p className="text-muted-foreground mb-8">{t.lastUpdated}</p>

        <div className="space-y-8">
          {t.sections.map((section, index) => (
            <section key={index} className="prose prose-gray dark:prose-invert max-w-none">
              <h2 className="text-xl font-semibold text-foreground mb-3">
                {section.title}
              </h2>
              <div className="text-muted-foreground whitespace-pre-line leading-relaxed">
                {section.content}
              </div>
            </section>
          ))}
        </div>
      </main>

      {/* 푸터 */}
      <footer className="border-t border-border mt-16">
        <div className="mx-auto max-w-4xl px-4 py-8 text-center text-muted-foreground text-sm">
          <p>&copy; {new Date().getFullYear()} gwanggo. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
