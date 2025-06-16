"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle, Map, Gift, Smartphone } from "lucide-react";
import Image from "next/image";
import { t } from "@/lib/i18n";
import { useLanguage } from "@/context/LanguageContext";
import { useSession } from "next-auth/react";

export default function IntroPage() {
  const { language } = useLanguage();
  const { status } = useSession();
  return (
    <main className="min-h-screen bg-white pb-16">
      <div className="mx-auto max-w-[393px] p-5 space-y-10">
        {/* Header Section */}
        <section className="space-y-5 pt-4">
          <div className="space-y-1">
            <h1 className="text-4xl font-black">
              <Image
                width={180}
                height={30}
                src={"/logos/logo_black.png"}
                alt="ta:pass logo"
                className="object-contain"
              />
            </h1>
            <h2 className="text-lg font-bold">
              {t("intro.subTitle", language)}
            </h2>
          </div>

          <p className="text-m text-gray-700 pb-8">
            {t("intro.description", language)}
          </p>
          <Link href={status === "authenticated" ? "/mypage" : "/login"}>
            <Button className="w-full bg-blue-500 mb-8 mt-5 hover:bg-blue-600 rounded-full py-3">
              {t("intro.cta", language)}
            </Button>
          </Link>
        </section>

        {/* Why TA PASS Section */}
        <section className="space-y-8">
          <div className="space-y-1">
            <h2 className="text-3xl font-extrabold">
              {t("intro.whyTitle", language)}
            </h2>
            <p className="text-md font-semibold">
              {t("intro.whyDesc", language)}
            </p>
          </div>

          {/* You get perks */}
          <div className="flex items-start gap-4">
            <div className="flex-1 space-y-1">
              <h3>{t("intro.perkTitle", language)}</h3>
              <p>{t("intro.perkDesc", language)}</p>
            </div>
            <div className="w-24 h-24 flex items-center justify-center">
              <Image
                src="/intros/intro_image_1.svg"
                alt="Perks icon"
                width={96}
                height={96}
                className="object-contain"
              />
            </div>
          </div>

          {/* You skip confusion */}
          <div className="flex items-start gap-4">
            <div className="flex-1 space-y-1">
              <h3>{t("intro.skipTitle", language)}</h3>
              <p>{t("intro.skipDesc", language)}</p>
            </div>
            <div className="w-24 h-24 flex items-center justify-center">
              <Image
                src="/intros/intro_image_2.png"
                alt="Skip confusion icon"
                width={96}
                height={96}
                className="object-contain"
              />
            </div>
          </div>

          {/* You explore smart */}
          <div className="flex items-start gap-4">
            <div className="flex-1 space-y-1">
              <h3>{t("intro.exploreTitle", language)}</h3>
              <p>{t("intro.exploreDesc", language)}</p>
            </div>
            <div className="w-24 h-24 flex items-center justify-center">
              <Image
                src="/intros/intro_image_3.png"
                alt="Explore smart icon"
                width={96}
                height={96}
                className="object-contain"
              />
            </div>
          </div>

          {/* You travel light */}
          <div className="flex items-start gap-4">
            <div className="flex-1 space-y-1">
              <h3>{t("intro.travelTitle", language)}</h3>
              <p>{t("intro.travelDesc", language)}</p>
            </div>
            <div className="w-24 h-24 flex items-center justify-center">
              <Image
                src="/intros/intro_image_4.png"
                alt="Travel light icon"
                width={96}
                height={96}
                className="object-contain"
              />
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="space-y-6 pt-4">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold">TA PASS</h2>
            <p>{t("intro.finalDesc", language)}</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm flex items-center gap-2">
              <span className="text-yellow-500">
                <span className="text-m">🙋‍♀️</span>
              </span>
              {t("intro.question", language)}
              <Link href="/faq" className="text-blue-500">
                {t("intro.faq", language)}
              </Link>
            </p>
            <p className="text-sm flex items-center gap-2">
              <span className="text-yellow-500">👉</span>{" "}
              {t("intro.ready", language)}
            </p>
          </div>

          <Link href={status === "authenticated" ? "/mypage" : "/login"}>
            <Button className="w-full bg-blue-500 mb-8 mt-5 hover:bg-blue-600 rounded-full py-3">
              {t("intro.cta", language)}
            </Button>
          </Link>
        </section>
      </div>
    </main>
  );
}
