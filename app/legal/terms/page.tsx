/**
 * 이용약관 페이지
 */

'use client'

import Link from 'next/link'
import { useLanguage } from '@/contexts/language-context'
import { ArrowLeft } from 'lucide-react'

export default function TermsPage() {
  const { language } = useLanguage()

  const content = {
    ko: {
      title: '이용약관',
      lastUpdated: '최종 수정일: 2026년 1월 29일',
      backToHome: '홈으로 돌아가기',
      sections: [
        {
          title: '제1조 (목적)',
          content: `이 약관은 조코딩(이하 "회사")이 제공하는 AI 광고 콘텐츠 생성 서비스 AIAD(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.`,
        },
        {
          title: '제2조 (용어의 정의)',
          content: `1. "서비스"란 회사가 제공하는 AI 기반 이미지 광고, 영상 광고, 아바타 생성 및 관련 기능을 말합니다.
2. "이용자"란 이 약관에 따라 회사가 제공하는 서비스를 이용하는 회원을 말합니다.
3. "크레딧"이란 서비스 내에서 AI 콘텐츠 생성에 사용되는 가상의 결제 수단을 말합니다.
4. "콘텐츠"란 서비스를 통해 생성된 이미지, 영상, 음악 등 모든 결과물을 말합니다.`,
        },
        {
          title: '제3조 (약관의 효력 및 변경)',
          content: `1. 이 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력이 발생합니다.
2. 회사는 관련 법령을 위배하지 않는 범위에서 이 약관을 개정할 수 있습니다.
3. 약관이 변경되는 경우 회사는 변경 내용을 시행일 7일 전부터 서비스 내 공지사항을 통해 공지합니다.`,
        },
        {
          title: '제4조 (서비스의 제공)',
          content: `1. 회사는 다음과 같은 서비스를 제공합니다:
   - AI 이미지 광고 생성
   - AI 영상 광고 생성
   - AI 아바타 생성 및 의상 교체
   - AI 배경 이미지 생성
   - AI 음악 생성
2. 서비스는 연중무휴, 1일 24시간 제공을 원칙으로 합니다.
3. 회사는 시스템 점검, 장비 교체 등의 사유로 서비스 제공을 일시적으로 중단할 수 있습니다.`,
        },
        {
          title: '제5조 (지적재산권)',
          content: `1. 서비스를 통해 생성된 콘텐츠의 저작권은 해당 콘텐츠를 생성한 이용자에게 귀속됩니다.
2. 이용자는 생성된 콘텐츠를 상업적 목적으로 자유롭게 사용할 수 있습니다.
3. 다만, 서비스의 기술, 소프트웨어, 디자인 등에 대한 지적재산권은 회사에 귀속됩니다.
4. 이용자가 업로드한 제품 이미지, 아바타 원본 등의 저작권은 원 권리자에게 있으며, 이용자는 해당 자료의 사용 권한이 있음을 보증합니다.`,
        },
        {
          title: '제6조 (크레딧 및 결제)',
          content: `1. 서비스 이용에는 크레딧이 필요하며, 크레딧은 유료로 구매하거나 프로모션을 통해 획득할 수 있습니다.
2. 구매한 크레딧은 환불되지 않습니다. 다만, 관련 법령에서 정한 경우는 예외로 합니다.
3. 크레딧의 유효기간 및 사용 조건은 별도로 정한 바에 따릅니다.
4. 구독 서비스의 경우 매월 자동 결제되며, 해지 시 다음 결제일부터 적용됩니다.`,
        },
        {
          title: '제7조 (이용자의 의무)',
          content: `이용자는 다음 행위를 하여서는 안 됩니다:
1. 타인의 정보를 도용하거나 허위 정보를 등록하는 행위
2. 서비스를 이용하여 불법적인 콘텐츠를 생성하는 행위
3. 타인의 저작권, 초상권 등 권리를 침해하는 콘텐츠를 생성하는 행위
4. 서비스의 안정적 운영을 방해하는 행위
5. 기타 관련 법령에 위배되는 행위`,
        },
        {
          title: '제8조 (서비스 이용 제한)',
          content: `1. 회사는 이용자가 제7조의 의무를 위반한 경우 서비스 이용을 제한할 수 있습니다.
2. 이용 제한 시 회사는 이용자에게 그 사유를 통지합니다.
3. 이용자는 이용 제한에 대해 이의를 제기할 수 있습니다.`,
        },
        {
          title: '제9조 (면책조항)',
          content: `1. 회사는 천재지변, 전쟁, 기간통신사업자의 서비스 중단 등 불가항력적인 사유로 서비스를 제공할 수 없는 경우 책임이 면제됩니다.
2. 회사는 이용자의 귀책사유로 인한 서비스 이용 장애에 대해 책임을 지지 않습니다.
3. AI가 생성한 콘텐츠의 정확성, 적합성에 대해 회사는 보증하지 않으며, 콘텐츠 사용에 따른 책임은 이용자에게 있습니다.`,
        },
        {
          title: '제10조 (분쟁 해결)',
          content: `1. 서비스 이용과 관련하여 분쟁이 발생한 경우 회사와 이용자는 원만한 해결을 위해 성실히 협의합니다.
2. 협의가 이루어지지 않는 경우 대한민국 법률에 따라 관할 법원에서 해결합니다.`,
        },
      ],
    },
    en: {
      title: 'Terms of Service',
      lastUpdated: 'Last updated: January 29, 2026',
      backToHome: 'Back to Home',
      sections: [
        {
          title: 'Article 1 (Purpose)',
          content: `These Terms of Service govern the use of AI advertising content generation service AIAD (the "Service") provided by Jocoding (the "Company") and define the rights, obligations, and responsibilities between the Company and users.`,
        },
        {
          title: 'Article 2 (Definitions)',
          content: `1. "Service" refers to AI-based image ads, video ads, avatar generation, and related features provided by the Company.
2. "User" refers to members who use the Service in accordance with these Terms.
3. "Credits" refers to virtual payment units used for AI content generation within the Service.
4. "Content" refers to all outputs generated through the Service, including images, videos, and music.`,
        },
        {
          title: 'Article 3 (Effect and Amendment of Terms)',
          content: `1. These Terms become effective when posted on the Service screen or notified to users through other means.
2. The Company may amend these Terms within the scope that does not violate applicable laws.
3. When Terms are changed, the Company will announce the changes through in-service notices at least 7 days before the effective date.`,
        },
        {
          title: 'Article 4 (Provision of Service)',
          content: `1. The Company provides the following services:
   - AI image ad generation
   - AI video ad generation
   - AI avatar creation and outfit changes
   - AI background image generation
   - AI music generation
2. The Service is provided 24 hours a day, 365 days a year in principle.
3. The Company may temporarily suspend the Service for system maintenance, equipment replacement, etc.`,
        },
        {
          title: 'Article 5 (Intellectual Property Rights)',
          content: `1. Copyright of content generated through the Service belongs to the user who created it.
2. Users may freely use generated content for commercial purposes.
3. However, intellectual property rights for the Service's technology, software, and design belong to the Company.
4. Copyright of product images, original avatars, etc. uploaded by users belongs to the original rights holders, and users warrant that they have the right to use such materials.`,
        },
        {
          title: 'Article 6 (Credits and Payment)',
          content: `1. Credits are required to use the Service and can be purchased or obtained through promotions.
2. Purchased credits are non-refundable, except as required by applicable laws.
3. The validity period and conditions of use for credits are as separately specified.
4. Subscription services are automatically billed monthly, and cancellations take effect from the next billing date.`,
        },
        {
          title: 'Article 7 (User Obligations)',
          content: `Users shall not engage in the following activities:
1. Stealing others' information or registering false information
2. Creating illegal content using the Service
3. Creating content that infringes on others' copyrights, portrait rights, etc.
4. Interfering with the stable operation of the Service
5. Other activities that violate applicable laws`,
        },
        {
          title: 'Article 8 (Service Restriction)',
          content: `1. The Company may restrict Service use if a user violates the obligations in Article 7.
2. When restricting use, the Company will notify the user of the reason.
3. Users may raise objections to usage restrictions.`,
        },
        {
          title: 'Article 9 (Disclaimer)',
          content: `1. The Company is exempt from liability when unable to provide the Service due to force majeure such as natural disasters, war, or service interruption by telecommunications carriers.
2. The Company is not responsible for service disruptions caused by user negligence.
3. The Company does not guarantee the accuracy or suitability of AI-generated content, and users are responsible for using the content.`,
        },
        {
          title: 'Article 10 (Dispute Resolution)',
          content: `1. In case of disputes related to Service use, the Company and users shall negotiate in good faith for amicable resolution.
2. If negotiation fails, disputes shall be resolved in courts with jurisdiction under the laws of the Republic of Korea.`,
        },
      ],
    },
    ja: {
      title: '利用規約',
      lastUpdated: '最終更新日：2026年1月29日',
      backToHome: 'ホームに戻る',
      sections: [
        {
          title: '第1条（目的）',
          content: `本規約は、Jocoding（以下「当社」）が提供するAI広告コンテンツ生成サービスAIAD（以下「本サービス」）の利用に関し、当社と利用者間の権利、義務及び責任事項を定めることを目的とします。`,
        },
        {
          title: '第2条（用語の定義）',
          content: `1.「本サービス」とは、当社が提供するAIベースの画像広告、動画広告、アバター生成及び関連機能を指します。
2.「利用者」とは、本規約に従い当社が提供するサービスを利用する会員を指します。
3.「クレジット」とは、サービス内でAIコンテンツ生成に使用される仮想決済手段を指します。
4.「コンテンツ」とは、サービスを通じて生成された画像、動画、音楽等すべての成果物を指します。`,
        },
        {
          title: '第3条（規約の効力及び変更）',
          content: `1. 本規約は、サービス画面に掲示またはその他の方法で利用者に告知することにより効力を生じます。
2. 当社は関連法令に違反しない範囲で本規約を改定することができます。
3. 規約が変更される場合、当社は施行日の7日前からサービス内のお知らせを通じて告知します。`,
        },
        {
          title: '第4条（サービスの提供）',
          content: `1. 当社は以下のサービスを提供します：
   - AI画像広告生成
   - AI動画広告生成
   - AIアバター作成及び衣装変更
   - AI背景画像生成
   - AI音楽生成
2. サービスは年中無休、1日24時間提供を原則とします。
3. 当社はシステム点検、設備交換等の事由によりサービス提供を一時的に中断することができます。`,
        },
        {
          title: '第5条（知的財産権）',
          content: `1. サービスを通じて生成されたコンテンツの著作権は、当該コンテンツを生成した利用者に帰属します。
2. 利用者は生成されたコンテンツを商業目的で自由に使用できます。
3. ただし、サービスの技術、ソフトウェア、デザイン等に対する知的財産権は当社に帰属します。
4. 利用者がアップロードした製品画像、アバター原本等の著作権は原権利者にあり、利用者は当該資料の使用権限があることを保証します。`,
        },
        {
          title: '第6条（クレジット及び決済）',
          content: `1. サービス利用にはクレジットが必要であり、クレジットは有料で購入またはプロモーションを通じて獲得できます。
2. 購入したクレジットは返金されません。ただし、関連法令で定められた場合は例外とします。
3. クレジットの有効期間及び使用条件は別途定めるところによります。
4. サブスクリプションサービスの場合、毎月自動決済され、解約時は次回決済日から適用されます。`,
        },
        {
          title: '第7条（利用者の義務）',
          content: `利用者は以下の行為をしてはなりません：
1. 他人の情報を盗用または虚偽の情報を登録する行為
2. サービスを利用して違法なコンテンツを生成する行為
3. 他人の著作権、肖像権等の権利を侵害するコンテンツを生成する行為
4. サービスの安定的な運営を妨害する行為
5. その他関連法令に違反する行為`,
        },
        {
          title: '第8条（サービス利用制限）',
          content: `1. 当社は利用者が第7条の義務に違反した場合、サービス利用を制限することができます。
2. 利用制限時、当社は利用者にその事由を通知します。
3. 利用者は利用制限に対して異議を申し立てることができます。`,
        },
        {
          title: '第9条（免責条項）',
          content: `1. 当社は天災地変、戦争、基幹通信事業者のサービス中断等の不可抗力的な事由でサービスを提供できない場合、責任が免除されます。
2. 当社は利用者の帰責事由による サービス利用障害について責任を負いません。
3. AIが生成したコンテンツの正確性、適合性について当社は保証せず、コンテンツ使用に伴う責任は利用者にあります。`,
        },
        {
          title: '第10条（紛争解決）',
          content: `1. サービス利用に関連して紛争が発生した場合、当社と利用者は円満な解決のため誠実に協議します。
2. 協議が成立しない場合、大韓民国の法律に従い管轄裁判所で解決します。`,
        },
      ],
    },
    zh: {
      title: '服务条款',
      lastUpdated: '最后更新：2026年1月29日',
      backToHome: '返回首页',
      sections: [
        {
          title: '第一条（目的）',
          content: `本条款旨在规定Jocoding（以下简称"公司"）提供的AI广告内容生成服务AIAD（以下简称"服务"）的使用，以及公司与用户之间的权利、义务和责任。`,
        },
        {
          title: '第二条（术语定义）',
          content: `1."服务"是指公司提供的基于AI的图片广告、视频广告、虚拟形象生成及相关功能。
2."用户"是指根据本条款使用公司提供服务的会员。
3."积分"是指在服务中用于AI内容生成的虚拟支付手段。
4."内容"是指通过服务生成的所有成果，包括图片、视频、音乐等。`,
        },
        {
          title: '第三条（条款的效力及变更）',
          content: `1. 本条款通过在服务界面公示或其他方式通知用户后生效。
2. 公司可在不违反相关法律的范围内修改本条款。
3. 条款变更时，公司将在生效日前7天通过服务内公告通知。`,
        },
        {
          title: '第四条（服务提供）',
          content: `1. 公司提供以下服务：
   - AI图片广告生成
   - AI视频广告生成
   - AI虚拟形象创建及服装更换
   - AI背景图片生成
   - AI音乐生成
2. 服务原则上全年无休、每天24小时提供。
3. 公司可因系统维护、设备更换等原因暂时中断服务。`,
        },
        {
          title: '第五条（知识产权）',
          content: `1. 通过服务生成的内容的版权归属于生成该内容的用户。
2. 用户可自由将生成的内容用于商业目的。
3. 但是，服务的技术、软件、设计等知识产权归公司所有。
4. 用户上传的产品图片、虚拟形象原图等的版权归原权利人所有，用户保证有权使用这些材料。`,
        },
        {
          title: '第六条（积分及支付）',
          content: `1. 使用服务需要积分，积分可通过付费购买或促销活动获得。
2. 已购买的积分不予退款，但相关法律规定的情况除外。
3. 积分的有效期和使用条件另行规定。
4. 订阅服务按月自动扣费，取消订阅从下一个扣费日起生效。`,
        },
        {
          title: '第七条（用户义务）',
          content: `用户不得从事以下行为：
1. 盗用他人信息或注册虚假信息
2. 利用服务创建非法内容
3. 创建侵犯他人版权、肖像权等权利的内容
4. 干扰服务的稳定运营
5. 其他违反相关法律的行为`,
        },
        {
          title: '第八条（服务限制）',
          content: `1. 用户违反第七条义务时，公司可限制服务使用。
2. 限制使用时，公司将通知用户原因。
3. 用户可对使用限制提出异议。`,
        },
        {
          title: '第九条（免责条款）',
          content: `1. 因自然灾害、战争、基础电信运营商服务中断等不可抗力原因无法提供服务时，公司免责。
2. 公司对因用户原因导致的服务使用障碍不承担责任。
3. 公司不保证AI生成内容的准确性和适用性，内容使用的责任由用户承担。`,
        },
        {
          title: '第十条（争议解决）',
          content: `1. 与服务使用相关的争议发生时，公司与用户应诚信协商以求友好解决。
2. 协商不成时，按照大韩民国法律在管辖法院解决。`,
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
          <p>&copy; {new Date().getFullYear()} AIAD. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
