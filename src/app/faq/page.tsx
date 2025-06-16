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
import { useLanguage } from "@/context/LanguageContext";
import { t } from "@/lib/i18n";

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

  const { language } = useLanguage();

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
      question: t("faq.passInfo.q1.question", language),
      answer: (
        <p className="text-xs whitespace-pre-line">
          {t("faq.passInfo.q1.answer", language)}
        </p>
      ),
    },
    {
      question: t("faq.passInfo.q2.question", language),
      answer: (
        <p className="text-xs whitespace-pre-line">
          {t("faq.passInfo.q2.answer", language)}
        </p>
      ),
    },
    {
      question: t("faq.passInfo.q3.question", language),
      answer: (
        <p className="text-xs whitespace-pre-line">
          {t("faq.passInfo.q3.answer", language)}
        </p>
      ),
    },
  ];

  // 매장 이용 안내 FAQ
  const storeInfoFAQ = [
    {
      question: t("faq.storeInfo.q1.question", language),
      answer: (
        <p className="text-xs whitespace-pre-line">
          {t("faq.storeInfo.q1.answer", language)}
        </p>
      ),
    },
    {
      question: t("faq.storeInfo.q2.question", language),
      answer: (
        <p className="text-xs whitespace-pre-line">
          {t("faq.storeInfo.q2.answer", language)}
        </p>
      ),
    },
    {
      question: t("faq.storeInfo.q3.question", language),
      answer: (
        <p className="text-xs whitespace-pre-line">
          {t("faq.storeInfo.q3.answer", language)}
        </p>
      ),
    },
  ];

  // 사용 방법 및 조건 FAQ
  const usageFAQ = [
    {
      question: t("faq.usage.q1.question", language),
      answer: (
        <p className="text-xs whitespace-pre-line">
          {t("faq.usage.q1.answer", language)}
        </p>
      ),
    },
    {
      question: t("faq.usage.q2.question", language),
      answer: (
        <p className="text-xs whitespace-pre-line">
          {t("faq.usage.q2.answer", language)}
        </p>
      ),
    },
    {
      question: t("faq.usage.q3.question", language),
      answer: (
        <p className="text-xs whitespace-pre-line">
          {t("faq.usage.q3.answer", language)}
        </p>
      ),
    },
  ];

  const tabConfig = [
    { id: "passInfo", name: t("faq.tab.passInfo", language), ref: passInfoRef },
    {
      id: "storeInfo",
      name: t("faq.tab.storeInfo", language),
      ref: storeInfoRef,
    },
    { id: "usage", name: t("faq.tab.usage", language), ref: usageRef },
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
          <h1 className="text-3xl font-extrabold mb-1">
            {t("faq.title", language)}
          </h1>
          <h2 className="text-2xl mb-3 font-bold">
            {t("faq.subtitle", language)}
          </h2>
          <p className="text-lg mb-6 mt-8 ">{t("faq.guideText", language)}</p>
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
              🎫 {t("faq.tab.passInfo", language)}
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
              🛍️ {t("faq.tab.storeInfo", language)}
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
              💡 {t("faq.tab.usage", language)}
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
              {t("faq.contactTitle", language)}
            </h2>

            <p className="text-gray-600 text-sm">
              <span className="block mb-6">
                {t("faq.contactDesc", language)} <br />
                {/* 이메일로 보내주시면 최대한 빠르게 답변드릴게요! */}
              </span>

              <span className="block font-medium text-gray-800 mb-6">
                {t("faq.contactEmail", language)}
              </span>

              <span className="block text-xs text-gray-500">
                {t("faq.contactNote", language)}
                <br />
                {/* FAQ에 없는 내용이라면, 편하게 문의해주세요! */}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
