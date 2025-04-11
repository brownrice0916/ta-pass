import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle, Map, Gift, Smartphone } from "lucide-react";
import Image from "next/image";

export default function IntroPage() {
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
            <h2 className="text-lg font-bold">Your Trip Ambassador in Korea</h2>
          </div>

          <p className="text-m text-gray-700 pb-8">
            Your shortcut to real local spots and exclusive travel perks.
            Designed for travelers like you — to explore with confidence, like a
            local.
          </p>

          <Link href="/register">
            <Button className="w-full bg-blue-500 mb-8 mt-5 hover:bg-blue-600 rounded-full py-3">
              Sign up & Activate My TA PASS
            </Button>
          </Link>
        </section>

        {/* Why TA PASS Section */}
        <section className="space-y-8">
          <div className="space-y-1">
            <h2 className="text-3xl font-extrabold">Why TA PASS?</h2>
            <p className="text-md font-semibold">
              What makes this pass different —
              <br />
              and why it's worth having on your trip.
            </p>
          </div>

          {/* You get perks */}
          <div className="flex items-start gap-4">
            <div className="flex-1 space-y-1">
              <h3 className="text-lg font-semibold text-[#D4DF00]">
                You get perks
              </h3>
              <p className="text-sm text-gray-700">
                Special gifts, discounts, and more. Check out each benefit in
                advance through the Explore Map.
              </p>
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
              <h3 className="text-lg font-semibold text-[#D4DF00]">
                You skip confusion
              </h3>
              <p className="text-sm text-gray-700">
                No reservations, no complicated steps. Just show your pass and
                go.
              </p>
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
              <h3 className="text-lg font-semibold text-[#D4DF00]">
                You explore smart
              </h3>
              <p className="text-sm text-gray-700">
                Find local spots near you on the map, with filters by region,
                category, and more.
              </p>
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
              <h3 className="text-lg font-semibold text-[#D4DF00]">
                You travel light
              </h3>
              <p className="text-sm text-gray-700">
                All you need is one pass — right on your phone.
              </p>
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
            <p className="text-md font-semibold">
              helps you skip the guesswork —
              <br />
              and enjoy more of Korea
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm flex items-center gap-2">
              <span className="text-yellow-500">
                <span className="text-m">🙋‍♀️</span>
              </span>{" "}
              Got a question?{" "}
              <Link href="/faq" className="text-blue-500">
                [View FAQ]
              </Link>
            </p>
            <p className="text-sm flex items-center gap-2">
              <span className="text-yellow-500">👉</span> Ready to unlock your
              TA PASS?
            </p>
          </div>

          <Link href="/register">
            <Button className="mt-8 mb-8 w-full bg-blue-500 hover:bg-blue-600 rounded-full py-3">
              Sign up & Activate My TA PASS
            </Button>
          </Link>
        </section>
      </div>
    </main>
  );
}
