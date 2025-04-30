"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Headphones,
  User,
  Gift,
  Globe,
  ShoppingCart,
  ShoppingBag,
  Globe2,
  ChevronDown,
} from "lucide-react";
import Image from "next/image";

export default function FAQPage() {
  const [activeTab, setActiveTab] = useState("passInfo");
  const [stickyTabBar, setStickyTabBar] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false); // 스크롤 중인지 추적
  const [tabBarPosition, setTabBarPosition] = useState(0); // 탭바의 원래 위치

  // 각 섹션에 대한 참조 생성 (HTMLDivElement 타입 명시)
  const passInfoRef = useRef<HTMLDivElement>(null);
  const storeInfoRef = useRef<HTMLDivElement>(null);
  const usageRef = useRef<HTMLDivElement>(null);
  const tabBarRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 컨테이너 너비 측정
  useEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
    }

    // 윈도우 리사이즈 시 너비 업데이트
    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // 탭바의 원래 위치 저장 - DOM이 완전히 로드된 후
  useEffect(() => {
    // 탭바 위치 계산 함수
    const calculateTabBarPosition = () => {
      if (tabBarRef.current) {
        const rect = tabBarRef.current.getBoundingClientRect();
        const scrollTop =
          window.pageYOffset || document.documentElement.scrollTop;
        const position = rect.top + scrollTop;
        setTabBarPosition(position);

        // 디버깅용 로깅
        console.log("TabBar position calculated:", position);
      }
    };

    // DOM이 완전히 로드된 후 위치 계산
    if (document.readyState === "complete") {
      calculateTabBarPosition();
    } else {
      window.addEventListener("load", calculateTabBarPosition);
      return () => window.removeEventListener("load", calculateTabBarPosition);
    }

    // setTimeout으로 늦게 한번 더 계산 (SPA에서 필요할 수 있음)
    const timer = setTimeout(calculateTabBarPosition, 300);
    return () => clearTimeout(timer);
  }, []);

  // 스크롤 이벤트 처리 함수
  useEffect(() => {
    const handleScroll = () => {
      // 탭바 위치가 계산되지 않았으면 처리하지 않음
      if (!tabBarRef.current || !containerRef.current || tabBarPosition === 0) {
        return;
      }

      const scrollPosition =
        window.pageYOffset || document.documentElement.scrollTop;
      const offset = 10; // 약간의 여유를 두어 정확한 위치에서 전환되도록 함

      // 스크롤 위치가 탭바의 원래 위치를 지나면 고정
      if (scrollPosition >= tabBarPosition - offset && !stickyTabBar) {
        console.log("Setting sticky to true");
        setStickyTabBar(true);
      }
      // 스크롤 위치가 탭바의 원래 위치보다 위에 있으면 고정 해제
      else if (scrollPosition < tabBarPosition - offset && stickyTabBar) {
        console.log("Setting sticky to false");
        setStickyTabBar(false);
      }
    };

    // 현재 화면에 보이는 섹션에 따라 활성 탭 업데이트
    const updateActiveTabOnScroll = () => {
      // 사용자가 클릭해서 스크롤 중일 때는 활성 탭 업데이트 건너뛰기
      if (isScrolling) return;
      if (!containerRef.current) return;

      const sections = [
        { id: "passInfo", ref: passInfoRef },
        { id: "storeInfo", ref: storeInfoRef },
        { id: "usage", ref: usageRef },
      ];

      // 현재 위치를 기준으로 가장 가까운 섹션 찾기
      let closestSection = sections[0];
      let closestDistance = Infinity;

      sections.forEach((section) => {
        if (!section.ref.current) return;

        const sectionRect = section.ref.current.getBoundingClientRect();
        // 탭바 높이를 고려한 상대적 위치 계산
        const tabBarHeight =
          stickyTabBar && tabBarRef.current
            ? tabBarRef.current.clientHeight
            : 0;
        // 섹션의 상단 위치에서 탭바 높이를 뺌
        const adjustedTop = sectionRect.top - tabBarHeight;

        // 화면 상단에 가장 가까운 섹션 찾기
        const distance = Math.abs(adjustedTop);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestSection = section;
        }
      });

      if (closestSection.id !== activeTab) {
        setActiveTab(closestSection.id);
      }
    };

    // 스크롤 이벤트 리스너 등록
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("scroll", updateActiveTabOnScroll);

    // 초기 스크롤 위치 확인
    handleScroll();

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("scroll", updateActiveTabOnScroll);
    };
  }, [stickyTabBar, activeTab, isScrolling, tabBarPosition]);

  // 탭 클릭 시 해당 섹션으로 스크롤
  const scrollToSection = (
    sectionRef: React.RefObject<HTMLDivElement>,
    tabName: string
  ) => {
    if (!sectionRef.current) return;

    // 탭 상태 즉시 업데이트
    setActiveTab(tabName);

    // 스크롤 중 플래그 설정
    setIsScrolling(true);

    // 섹션 상단 위치 계산
    const sectionTop = sectionRef.current.getBoundingClientRect().top;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const tabBarHeight =
      stickyTabBar && tabBarRef.current ? tabBarRef.current.clientHeight : 0;

    // 스크롤할 대상 위치
    const targetPosition = scrollTop + sectionTop - tabBarHeight;

    // 스크롤 애니메이션
    window.scrollTo({
      top: targetPosition,
      behavior: "smooth",
    });

    // 스크롤 애니메이션이 완료된 후 스크롤 플래그 해제
    // 스크롤 이벤트에 의한 활성 탭 업데이트를 다시 활성화
    setTimeout(() => {
      setIsScrolling(false);
    }, 500); // 스크롤 애니메이션이 완료되는 시간보다 약간 길게 설정
  };

  const passInfoFAQ = [
    {
      question: "TA PASS는 뭐예요?",
      answer: (
        <p className="text-xs">
          TA PASS는 호텔에서 쇼핑 패스를 받고, 제휴된 로컬 매장을 방문해 혜택을
          받는 여행객 전용 서비스예요.,
        </p>
      ),
    },
    {
      question: "쇼핑 패스는 어떻게 사용하나요?",
      answer: (
        <div className="space-y-3 text-xs">
          <p className="p-0 m-0">
            호텔에서 받은 시리얼 번호를 웹 또는 앱에 등록하고,
            <br />
            제휴 매장에서 등록된 패스 화면을 보여주면 혜택이 적용돼요.
          </p>

          <div className="mt-2">
            <p className="font-medium">【패스 등록 방법】</p>
            <p>
              → TA PASS 웹/앱 접속 → 로그인 → My Pass → 시리얼 번호 입력 및
              활성화
            </p>
            <p>* 시리얼 번호는 호텔에서 받은 종이 패스에 있어요.</p>
          </div>
        </div>
      ),
    },
    {
      question: "쇼핑 패스는 어떻게 발급할 수 있나요?",
      answer: (
        <div className="space-y-2 text-xs">
          <p>
            TA PASS 제휴 호텔의 숙박 패키지 상품을 예약하고,
            <br />
            체크인 당일 프론트에서 종이 패스를 받아요.
            <br />→ QR코드를 스캔하면 TA PASS 웹으로 바로 연결돼요!
          </p>
        </div>
      ),
    },
  ];

  // 매장 이용 안내 FAQ
  const storeInfoFAQ = [
    {
      question: "제휴 로컬 매장은 어디서 확인하나요?",
      answer: (
        <div className="space-y-3 text-xs">
          <p>
            TA PASS 앱 또는 웹의 '지도(Explore)' 탭에서 확인할 수 있어요.
            <br />
            위치 기반 탐색 + 다양한 필터 기능으로 원하는 매장을 쉽게 찾을 수
            있어요.
            <br />→ 매장 위치, 제공 혜택, 운영시간, 리뷰까지 한눈에 확인 가능!
          </p>
        </div>
      ),
    },
    {
      question: "어떤 혜택이 있어요?",
      answer: (
        <div className="space-y-3 text-xs">
          <p>매장마다 다르지만 보통 아래와 같은 혜택을 제공해요:</p>
          <ul className="list-disc ml-5 space-y-1 t">
            <li>💸 할인</li>
            <li>🎁 사은품 증정</li>
            <li>☕ 1+1 이벤트</li>
          </ul>
          <br />→ 매장 상세 페이지에서 혜택 내용을 꼭 확인하세요!
        </div>
      ),
    },
    {
      question: "리뷰는 어떻게 남기나요?",
      answer: (
        <div className="space-y-3 text-xs">
          <p>
            매장 방문 후 혜택 사용 페이지에서 리뷰 작성 버튼을 눌러주세요.
            <br />→ 작성한 리뷰는 자동 번역되어 다른 여행자에게도 공유돼요!
          </p>
        </div>
      ),
    },
  ];

  // 사용 방법 및 조건 FAQ
  const usageFAQ = [
    {
      question: "이용 요금이 있나요?",
      answer: (
        <div className="space-y-3 text-xs">
          <p>
            없습니다!
            <br />
            TA PASS는 제휴 호텔을 이용하는 외국인 여행자에게 무료로 제공되는
            서비스예요.
          </p>
        </div>
      ),
    },
    {
      question: "앱을 꼭 설치해야 하나요?",
      answer: (
        <div className="space-y-3 text-xs">
          <p>
            아니요.
            <br />
            호텔에서 받은 QR코드를 스캔하면 웹으로 바로 연결되며,
            <br />앱 설치 없이도 모든 기능을 사용할 수 있어요.
          </p>
        </div>
      ),
    },
    {
      question: "회원가입이 꼭 필요한가요?",
      answer: (
        <div className="space-y-3 text-xs">
          <p>
            매장 정보는 회원가입 없이도 확인 가능해요.
            <br />
            하지만 혜택을 사용하려면 로그인 및 패스 등록이 필요해요.
          </p>
        </div>
      ),
    },
  ];

  const tabConfig = [
    { id: "passInfo", name: "패스 안내", ref: passInfoRef },
    { id: "storeInfo", name: "매장 이용 안내", ref: storeInfoRef },
    { id: "usage", name: "사용 방법 및 조건", ref: usageRef },
  ];

  // 고정 탭바 스타일
  const fixedTabBarStyle = {
    position: "sticky" as const,
    top: "60px",
    width: "100%",
    maxWidth: "448px", // max-w-md의 값
    zIndex: 10,
    backgroundColor: "white",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
  };

  return (
    <div ref={containerRef} className="max-w-md mx-auto pb-10">
      {/* 메인 컨텐츠 */}
      <div>
        {/* FAQ 헤더 */}
        <div className="p-6">
          <h1 className="text-3xl font-extrabold mb-1">FAQ</h1>
          <h2 className="text-2xl mb-3 font-bold">자주 묻는 질문</h2>
          <p className="text-lg mb-6 mt-8 ">
            처음이시라면 여기를 먼저 확인해보세요! 🙋‍
          </p>
        </div>

        {/* 탭 네비게이션 - 모든 탭에 밑줄 추가 */}
        <div
          ref={tabBarRef}
          className={`flex bg-white ${!stickyTabBar ? "w-full" : ""}`}
          style={stickyTabBar ? fixedTabBarStyle : {}}
        >
          {tabConfig.map((tab) => (
            <button
              key={tab.id}
              className="group flex-1 py-3 text-sm font-medium transition-all relative border-b-2 border-gray-200"
              onClick={() => scrollToSection(tab.ref as any, tab.id)}
            >
              <span
                className={`
                block relative pb-1 transition-colors
                ${activeTab === tab.id ? "text-blue-600" : "text-gray-500"}
              `}
              >
                {tab.name}
              </span>
              {/* 밑줄 표시 */}
              <span
                className={`
                absolute bottom-0 left-0 w-full h-0.5 -mb-0.5
                ${activeTab === tab.id ? "bg-blue-600" : "bg-transparent"}
                transition-colors duration-200
              `}
              ></span>
            </button>
          ))}
        </div>

        {/* 탭바가 고정되었을 때 빈 공간 채우기 */}
        {stickyTabBar && tabBarRef.current && (
          <div style={{ height: `${tabBarRef.current.clientHeight}px` }} />
        )}

        {/* 메인 콘텐츠 */}
        <div className="p-4">
          <div id="passInfo" ref={passInfoRef} className="mb-8 scroll-mt-20">
            <h3 className="text-xl font-extrabold text-[#8d8d8d] mb-4">
              🎫 패스 안내
            </h3>

            <div className="space-y-2">
              {passInfoFAQ.map((item, index) => (
                <Accordion key={`pass-${index}`} type="single" collapsible>
                  <AccordionItem
                    value={`pass-item-${index}`}
                    className="border border-gray-200 rounded-lg overflow-hidden mb-3"
                  >
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                      <div className="flex items-center">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium mr-3">
                          Q
                        </span>
                        <span className="text-sm font-medium text-left">
                          {item.question}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 text-sm">
                      <div className="pl-9">
                        {typeof item.answer === "string" ? (
                          <p>{item.answer}</p>
                        ) : (
                          item.answer
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ))}
            </div>
          </div>

          {/* 매장 이용 안내 섹션 */}
          <div id="storeInfo" ref={storeInfoRef} className="mb-8 scroll-mt-20">
            <h3 className="text-xl font-extrabold text-[#8d8d8d] mb-4">
              🛍️ 매장 이용 안내
            </h3>

            <div className="space-y-2">
              {storeInfoFAQ.map((item, index) => (
                <Accordion key={`store-${index}`} type="single" collapsible>
                  <AccordionItem
                    value={`store-item-${index}`}
                    className="border border-gray-200 rounded-lg overflow-hidden mb-3"
                  >
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                      <div className="flex items-center">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium mr-3">
                          Q
                        </span>
                        <span className="text-sm font-medium text-left">
                          {item.question}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 text-sm">
                      <div className="pl-9">
                        {typeof item.answer === "string" ? (
                          <p>{item.answer}</p>
                        ) : (
                          item.answer
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ))}
            </div>
          </div>

          {/* 사용 방법 및 조건 섹션 */}
          <div id="usage" ref={usageRef} className="mb-8 scroll-mt-20">
            <h3 className="text-xl font-extrabold text-[#8d8d8d] mb-4">
              💡 사용 방법 및 조건
            </h3>

            <div className="space-y-2">
              {usageFAQ.map((item, index) => (
                <Accordion key={`usage-${index}`} type="single" collapsible>
                  <AccordionItem
                    value={`usage-item-${index}`}
                    className="border border-gray-200 rounded-lg overflow-hidden mb-3"
                  >
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                      <div className="flex items-center">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium mr-3">
                          Q
                        </span>
                        <span className="text-sm font-medium text-left">
                          {item.question}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 text-sm">
                      <div className="pl-9">
                        {typeof item.answer === "string" ? (
                          <p>{item.answer}</p>
                        ) : (
                          item.answer
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ))}
            </div>
          </div>
        </div>

        {/* 문의 섹션 - 중앙 정렬 및 배경색 적용 */}
        <div className="px-4">
          <div className="bg-[#F3F4F6] p-8 rounded-2xl text-center my-8">
            <div className="flex justify-center mb-8">
              <Image
                src="/faq/faq_icon.png"
                alt="faq icon"
                width={47}
                height={52}
                className="object-contain"
              />
            </div>

            <h2 className="text-lg font-bold mb-4">
              👂 더 궁금한 점이 있으신가요?
            </h2>

            <p className="text-gray-600 text-sm">
              <span className="block mb-6">
                언제든 편하게 문의해주세요. <br />
                이메일로 보내주시면 최대한 빠르게 답변드릴게요!
              </span>

              <span className="block font-medium text-gray-800 mb-6">
                📧 이메일 : ta.pass.contact@gmail.com
              </span>

              <span className="block text-xs text-gray-500">
                평균적으로 1-2일 이내에 답변드리고 있어요.
                <br />
                FAQ에 없는 내용이라면, 편하게 문의해주세요!
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
