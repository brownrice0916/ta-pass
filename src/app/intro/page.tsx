import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Gift, Building2, Globe, Ticket, User2 } from "lucide-react";
import Image from "next/image";

export default function IntroPage() {
  const profiles = [
    {
      name: "초보 여행자",
      subTitle: "한국 방문 0회차",
      description: "한국은 처음이라 어디에 무엇이 있는지 모르겠어요.",
      bg: "bg-[#FFD700]",
      image: "/travelers/traveler_beginner.png",
    },
    {
      name: "고수 여행자",
      subTitle: "한국 방문 N회차",
      description:
        "이제 관광지는 다 가봤고, 현지인들의 찐 핫플을 가보고 싶어요.",
      bg: "bg-[#FF69B4]",
      image: "/travelers/traveler_mania.png",
    },
    {
      name: "알뜰한 여행자",
      subTitle: "갓성비 여행 추구",
      description: "여행 경비를 아끼고 싶어서 어디가 더 저렴한지 늘 고민해요.",
      bg: "bg-[#FF6347]",
      image: "/travelers/traveler_frugal.png",
    },
    {
      name: "바쁜 여행자",
      subTitle: "올인원 혜택 추구",
      description: "너무 바빠서 가게별로 혜택이나 쿠폰을 비교할 여유가 없어요.",
      bg: "bg-[#4169E1]",
      image: "/travelers/traveler_busy.png",
    },
  ];

  return (
    <main className="min-h-screen bg-background pb-[72px] mt-5">
      <div className="mx-auto max-w-[393px] space-y-8 p-4">
        {/* Header Section */}
        <section className="space-y-4">
          <h1 className="text-2xl font-bold">
            새로운
            <br />
            한국 로컬 쇼핑 가이드
          </h1>
          <p className="text-sm text-gray-600">
            어디로 가야 좋을지,
            <br />
            어떻게 해야 많은 것을 즐길 수 있을지 모르시겠다고요?
            <br />
            현지인이 즐겨찾는 맛집부터 쇼핑, 카페까지
            <br />
            놓치기 아까운 혜택과 정보, TA PASS로 꽉 채워보세요!
          </p>
          <Button className="w-full bg-blue-500 hover:bg-blue-600">
            내 여행보기
          </Button>
        </section>

        {/* User Profiles Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">
            한국 여행,
            <br />
            어떻게 하지?
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            이런 분들께 TA PASS를 추천합니다!
          </p>
          <div className="grid grid-cols-2 gap-2">
            {profiles.map((profile, i) => (
              <div
                key={i}
                className={`${profile.bg} p-6 flex flex-col items-center`}
              >
                {/* Profile Circle with Name */}
                <div className="relative w-24 h-24 mb-4">
                  <div className="w-full h-full bg-white rounded-full flex items-center justify-center shadow-md overflow-hidden">
                    <Image
                      src={profile.image}
                      alt="초보 여행자"
                      width={96} // 24 * 4 = 96px
                      height={96}
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                  <div className="absolute -bottom-1 left-0 right-0 bg-white rounded-full py-1 mx-auto w-4/5 text-center shadow-sm">
                    <p className="text-xs font-bold text-gray-800">
                      {profile.name}
                    </p>
                  </div>
                </div>

                {/* Text with semi-transparent background */}
                <div className="bg-white bg-opacity-80 rounded-lg p-3 w-full">
                  <p className="text-xs text-gray-700 mb-1 font-medium">
                    {profile.subTitle}
                  </p>
                  <p className="text-xs text-gray-800 leading-relaxed">
                    {profile.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Benefits Section */}
        <section className="space-y-6 bg-gray-50 p-6">
          <div className="space-y-2 text-2xl font-bold">
            <h2 className="">
              독점적 혜택
              <br />
              (스페셜 기프트/할인)
            </h2>
          </div>
          <div className="  ">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm text-gray-700">
                  패스 소지자에게만 주어지는
                  <br />
                  독점적 혜택을 누려보세요!
                  <br />
                  제휴 가게별로 제공하는
                  <br />
                  스페셜 기프트와 할인 내용을 알아보고
                  <br />
                  나에게 맞는 혜택을 찾으러
                  <br />
                  떠나는 여행!
                </p>
              </div>
              <Gift className="w-16 h-16 text-orange-500 flex-shrink-0" />
            </div>
          </div>
        </section>

        {/* Pass Service Section */}
        <section className="space-y-6 p-6 bg-gray-50">
          <div className="space-y-2 text-2xl font-bold">
            <h2 className="">
              빠르고 확실한
              <br />
              패스 수령
            </h2>
          </div>
          <div className="bg-gray-50 rounded-xl">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm text-gray-700">
                  어디서 패스를 받을지 찾아 헤매지 마세요!
                  <br />
                  속소 제휴원 시 패스를 수령하고
                  <br />
                  시리얼 넘버를 TA PASS에 등록하세요
                </p>
              </div>
              <Building2 className="w-16 h-16 text-blue-500 flex-shrink-0" />
            </div>
          </div>
        </section>

        {/* Map Section */}
        <section className="space-y-6 p-6 bg-gray-50">
          <div className="space-y-2 text-2xl font-bold ">
            <h2 className="">
              손쉬운 <br />
              제휴 매장 찾아보기
            </h2>
          </div>
          <div className="bg-gray-50  rounded-xl">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm text-gray-700">
                  매장을 하나하나 찾아보기 어려우시다구요?
                  <br />
                  TA MAP을 이용하여 현재 내위치와 가까운
                  <br />
                  제휴 매장을 알아보고 여행 동선을
                  <br />
                  계획해 보세요.
                </p>
              </div>
              <Globe className="w-16 h-16 text-green-500 flex-shrink-0" />
            </div>
          </div>
        </section>

        {/* Ticket Section */}
        <section className="space-y-6 bg-gray-50 p-6">
          <div className="space-y-2 text-2xl font-bold">
            <h2 className="">
              패스맛 있으면 충분한
              <br />
              올인원 패스
            </h2>
          </div>
          <div className="bg-gray-50 rounded-xl">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm text-gray-700">
                  여행 짐 싸기에도 바쁜데
                  <br />
                  여기서는 이 쿠폰, 저기서는 저 쿠폰
                  <br />
                  다양한 혜택을 이해 이것저것
                  <br /> 다 챙기셔야 한다구요?
                  <br />
                  예약한 숙소에서 체크인할 때 받은
                  <br />
                  TA PASS의 패스만 들고
                  <br />
                  제휴 매장들을 자유롭게 방문하세요!
                  <br />
                </p>
              </div>
              <Ticket className="w-16 h-16 text-pink-500 flex-shrink-0" />
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="space-y-4 p-6 mb-10 pb-20">
          <h2 className="text-2xl font-bold">
            한국 여행,
            <br />
            이제 TA PASS
            <br />
            하나로 충분합니다!
          </h2>
          <p className="text-sm text-gray-600 mb-10 pb-10">
            편리한 준비, 특별한 헤택, 그리고 손쉬운 여행까지
            <br />
            지금 바로 경험해 보세요.
          </p>
          <Link className="mt-5 pb-10" href="/register">
            <Button className="w-full bg-blue-500 hover:bg-blue-600">
              내 여행보기
            </Button>
          </Link>
        </section>
      </div>
    </main>
  );
}
