"use client";

import React, { JSX, useState } from "react";
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
} from "lucide-react";

export default function FAQPage() {
  const [activeTab, setActiveTab] = useState("tourists");

  const headerContent: {
    [key: string]: {
      title: string;
      subtitle: string;
      description: string;
      icons: JSX.Element;
    };
  } = {
    tourists: {
      title: "TA PASS",
      subtitle: "Your Trip Ambassador,",
      description: "Unlocking Exclusive Benefits",
      icons: (
        <div className="flex items-center justify-center gap-4 mb-8">
          <ShoppingCart size={32} className="text-gray-600" />
          <span className="text-2xl">+</span>
          <ShoppingBag size={32} className="text-gray-600" />
          <span className="text-2xl">=</span>
          <Gift size={32} className="text-gray-600" />
        </div>
      ),
    },
    partners: {
      title: "TA PASS Partners",
      subtitle: "Your Business Partner,",
      description: "Maximizing Your Business Value",
      icons: (
        <div className="flex items-center justify-center gap-4 mb-8">
          <User size={32} className="text-gray-600" />
          <span className="text-2xl">+</span>
          <Gift size={32} className="text-gray-600" />
          <span className="text-2xl">=</span>
          <Globe2 size={32} className="text-gray-600" />
        </div>
      ),
    },
  };

  const touristsFAQ = [
    {
      question: "TA PASS란 무엇인가요?",
      answer:
        "TA PASS는 제휴 매장에서 사용할 수 있는 패스와 여행지의 다양한 정보를 제공하는 편리한 여행 서비스 플랫폼입니다. 패스 소지자는 매장별 스페셜 기프트와 할인 등 특별한 혜택을 누릴 수 있습니다.",
    },
    {
      question: "패스는 어떻게 발급 수 있나요?",
      answer:
        "TA PASS는 제휴된 숙박 예약 사이트에서 패스가 포함된 숙박 상품을 볼 예약하시면 이용할 수 있습니다. 예약한 숙소에 체크인할 때 자리 앞 날짜가 기입된 패스가 제공됩니다.",
    },
    {
      question: "패스는 어떻게 사용하나요?",
      answer: (
        <div className="space-y-4">
          <div>
            <p className="font-medium mb-1">• 유효 기간</p>
            <p className="ml-4">시작일부터 통틀어 후 7일간 유효합니다.</p>
          </div>
          <div>
            <p className="font-medium mb-1">• 사용 장소</p>
            <p className="ml-4">제휴 매장에서 사용하실 수 있습니다.</p>
            <p className="ml-4">
              제휴 매장은 TA PASS 앱 또는 웹사이트에서 확인 가능합니다.
            </p>
          </div>
          <div>
            <p className="font-medium mb-1">• 사용 방법</p>
            <p className="ml-4">
              제휴 매장에서 TA PASS 로고인 - 방문 매장 검색 - 상세페이지 -
              '방문확인' 을 적절하게 화면을 캡처하여 매장에 보여줄 수 있습니다.
            </p>
            <p className="ml-4">
              각 매장별 제공 혜택과 자세한 사용방법은 매장별 상세페이지(TA PASS
              앱/웹페이지 - 매장별 검색)를 참고해주세요.
            </p>
          </div>
        </div>
      ),
    },
  ];

  const partnersFAQ = [
    {
      question: "TA PASS란 무엇인가요?",
      answer:
        "TA PASS는 제휴 매장에서 사용할 수 있는 패스와 여행지의 다양한 정보를 제공하는 편리한 여행 서비스 플랫폼입니다. 패스 소지자는 매장별 스페셜 기프트와 할인 등 특별한 혜택을 누릴 수 있습니다.",
    },
    {
      question: "TA PASS 파트너가 되면 어떤 혜택이 있나요?",
      answer: (
        <div>
          <p className="mb-3">
            TA PASS 파트너가 되시면 다음과 같은 혜택을 누리실 수 있습니다.
          </p>
          <div className="space-y-2 ml-4">
            <p>• TA PASS 이용 규모 유럽 여행객들에게 더 높은 노출 기회 제공</p>
            <p>• 다양한 고객층에게 직접 서비스를 홍보할 수 있는 기회 제공</p>
            <p>
              • 고객 상호작용(리뷰) 및 혜택 관리를 위한 효율적인 관리 도구 제공
            </p>
            <p>• ○○○ 데이터 제공</p>
          </div>
        </div>
      ),
    },
    {
      question: "TA PASS 파트너가 되려면 어떻게 해야 하나요?",
      answer:
        "TA PASS 파트너가 되시려면, 웹사이트를 방문하여 제휴 신청서를 작성해 주세요. 신청서 검토 후, 온보딩 과정을 안내해 드리겠습니다.",
    },
    {
      question: "TA PASS 혜택은 어떻게 제공하나요?",
      answer:
        "여행객이 'TA PASS 앱 - 로고인 - 매장별 검색 - '방문확' 화면을 매장에게 제시하면 즉시 앱 혜택을 제공합니다. 각 매장별 제공 혜택과 자세한 사용방법은 매장별 상세페이지(TA PASS 앱/웹페이지 - 매장별 검색 - 상세페이지)에서 관리하실 수 있습니다.",
    },
  ];

  return (
    <div className="max-w-2xl mx-auto min-h-screen bg-white pb-10">
      {/* 메인 컨텐츠 */}
      <div className="p-6">
        {/* Question Mark Section */}
        <div className="relative">
          <div className="text-gray-300 text-[150px] font-bold absolute right-0 top-0 -z-10">
            ?
          </div>
          <h1 className="text-4xl font-bold mb-6">
            {headerContent[activeTab].title}
          </h1>
          <h2 className="text-xl font-semibold mb-2">
            {headerContent[activeTab].subtitle}
          </h2>
          <p className="text-lg mb-8">{headerContent[activeTab].description}</p>

          {/* Dynamic Icons Section */}
          {headerContent[activeTab].icons}
          {/* Tabs with visible bottom border */}
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                className={`flex-1 py-4 text-lg font-medium transition-all relative
                ${
                  activeTab === "tourists"
                    ? "text-blue-600 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-blue-600"
                    : "text-gray-500 hover:text-gray-700 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-gray-200"
                }`}
                onClick={() => setActiveTab("tourists")}
              >
                Tourists
              </button>
              <button
                className={`flex-1 py-4 text-lg font-medium transition-all relative
                ${
                  activeTab === "partners"
                    ? "text-blue-600 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-blue-600"
                    : "text-gray-500 hover:text-gray-700 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-gray-200"
                }`}
                onClick={() => setActiveTab("partners")}
              >
                Partners
              </button>
            </div>
          </div>

          {/* Add margin after tabs */}
          {/* <div className="mb-8" /> */}
        </div>

        {/* FAQ Section */}
        <Accordion
          type="single"
          collapsible
          className="mb-12 divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden"
        >
          {(activeTab === "tourists" ? touristsFAQ : partnersFAQ).map(
            (item, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-white px-4 hover:bg-gray-50 transition-colors"
              >
                <AccordionTrigger className="text-left py-5 text-lg hover:no-underline group">
                  <div className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                      Q{index + 1}
                    </span>
                    <span className="font-medium text-gray-900 group-hover:text-blue-600">
                      {item.question}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  <div className="pb-5 pl-11">
                    {typeof item.answer === "string" ? (
                      <div className="bg-gray-50 rounded-lg p-4">
                        {item.answer}
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-4">
                        {item.answer}
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )
          )}
        </Accordion>

        {/* Contact Section style update */}
        <div className="text-center space-y-6 py-8 bg-gradient-to-b from-gray-50 to-white rounded-xl px-6 border border-gray-100 shadow-sm">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 mb-4">
            <Headphones size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            Still have questions?
          </h2>
          <p className="font-medium text-blue-600">We're here to help!</p>

          <div className="max-w-md mx-auto bg-white rounded-lg p-6 border border-gray-100">
            <div className="space-y-2">
              <p className="font-medium text-gray-900">
                Email: support@ta-pass.com
              </p>
              <p className="text-sm text-gray-500">
                Within 48 hours (business days)
                <br />
                after the email inquiry is submitted.
              </p>
            </div>

            <div className="border-t border-gray-100 my-4"></div>

            <div className="pt-2">
              <p className="font-medium text-gray-900 mb-2">Operating Hours</p>
              <p className="text-gray-600">Monday to Friday: 00:00 - 00:00</p>
            </div>
          </div>

          <p className="text-gray-600">
            Feel free to contact us anytime for assistance!
          </p>
        </div>
      </div>
    </div>
  );
}
