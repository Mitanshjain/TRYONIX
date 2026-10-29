"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  motion,
  MotionConfig,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import { Anton, Cormorant_Garamond } from "next/font/google";
import BagIcon from "@/components/BagIcon";
import {
  ArrowUpRight,
  ArrowRight,
  Menu,
  X,
  Sparkles,
  Camera,
} from "lucide-react";

import AccountIcon from "@/components/AccountIcon";
import WishlistIcon from "@/components/WishlistIcon";

/* ---------- VISUAL TOKENS ---------- */
const display = Anton({ weight: "400", subsets: ["latin"] });
const serif = Cormorant_Garamond({
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  subsets: ["latin"],
});

const outline = {
  WebkitTextStroke: "1px rgba(255,255,255,0.8)",
  color: "transparent",
} as const;

const grain = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`;

const navLink =
  "relative transition hover:text-[#b9a6dc] after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-0 after:bg-[#b9a6dc] after:transition-all after:duration-300 hover:after:w-full";

/* ---------- ORIGINAL DATA ---------- */
const reveal = {
  hidden: { opacity: 0, y: 45 },
  visible: { opacity: 1, y: 0 },
};

const collections = [
  {
    number: "01",
    title: "THE NEW FORM",
    category: "WOMENSWEAR",
    image:
      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1200&q=85",
  },
  {
    number: "02",
    title: "MODERN UNIFORM",
    category: "MENSWEAR",
    image:
      "https://images.unsplash.com/photo-1488161628813-04466f872be2?auto=format&fit=crop&w=1200&q=85",
  },
  {
    number: "03",
    title: "AFTER HOURS",
    category: "EDITORIAL",
    image:
      "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=1200&q=85",
  },
];

/* visual-only: staircase layout for the collection cards */
const layouts = [
  "md:col-span-5",
  "md:col-span-4 md:mt-24",
  "md:col-span-3 md:mt-48",
];

const manifestoA = "FASHION IS NOT JUST WHAT YOU WEAR.".split(" ");
const manifestoB = "IT'S HOW YOU EXPRESS YOURSELF.".split(" ");

function Word({
  children,
  progress,
  range,
  className = "",
}: {
  children: string;
  progress: MotionValue<number>;
  range: [number, number];
  className?: string;
}) {
  const opacity = useTransform(progress, range, [0.15, 1]);
  return (
    <motion.span style={{ opacity }} className={className}>
      {children}{" "}
    </motion.span>
  );
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const heroRef = useRef<HTMLElement>(null);
  const manifestoRef = useRef<HTMLHeadingElement>(null);

  const { scrollYProgress: pageProgress } = useScroll();
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const { scrollYProgress: manifestoProgress } = useScroll({
    target: manifestoRef,
    offset: ["start 0.85", "end 0.55"],
  });

  const bgY = useTransform(heroProgress, [0, 1], ["0%", "18%"]);
  const textY = useTransform(heroProgress, [0, 1], ["0%", "-14%"]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const total = manifestoA.length + manifestoB.length;

  return (
    <MotionConfig reducedMotion="user">
      <main className="min-h-screen overflow-hidden bg-black text-white">
        {/* film grain + scroll progress */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[60] opacity-[0.08] mix-blend-overlay"
          style={{ backgroundImage: grain }}
        />
        <motion.div
          aria-hidden
          style={{ scaleX: pageProgress }}
          className="fixed left-0 top-0 z-[70] h-[2px] w-full origin-left bg-[#b9a6dc]"
        />

        {/* NAVBAR */}
        <header
          className={`fixed left-0 top-0 z-50 w-full transition-all duration-500 ${
            scrolled
              ? "border-b border-white/10 bg-black/80 backdrop-blur-xl"
              : "bg-transparent"
          }`}
        >
          <nav className="mx-auto flex h-20 max-w-[1800px] items-center justify-between px-6 md:px-12">
            <Link
              href="/"
              className={`${serif.className} text-3xl font-light tracking-[0.3em] md:text-4xl`}
            >
              TRYONIX<span className="text-[#b9a6dc]">.</span>
            </Link>

            <div className="hidden items-center gap-12 text-[11px] font-medium tracking-[0.22em] md:flex">
              <Link href="/shop" className={navLink}>
                SHOP
              </Link>
              <a href="#collections" className={navLink}>
                COLLECTIONS
              </a>
              <Link href="/tryon" className={navLink}>
                VIRTUAL TRY-ON
              </Link>
              <a href="#experience" className={navLink}>
                THE EXPERIENCE
              </a>
              <a href="#about" className={navLink}>
                OUR WORLD
              </a>
            </div>

            <div className="flex items-center gap-5">

              <AccountIcon />

              <WishlistIcon />

              <BagIcon />

              <button
                type="button"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden"
              >
                {menuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </nav>

          {menuOpen && (
            <div
              className={`${display.className} flex flex-col gap-5 border-t border-white/10 bg-black px-6 py-8 text-4xl tracking-wide md:hidden`}
            >
              <Link href="/shop" onClick={() => setMenuOpen(false)}>
                SHOP
              </Link>
              <a href="#collections" onClick={() => setMenuOpen(false)}>
                COLLECTIONS
              </a>
              <Link href="/tryon" onClick={() => setMenuOpen(false)}>
                VIRTUAL TRY-ON
              </Link>
              <a href="#experience" onClick={() => setMenuOpen(false)}>
                THE EXPERIENCE
              </a>
              <a href="#about" onClick={() => setMenuOpen(false)}>
                OUR WORLD
              </a>
            </div>
          )}
        </header>

        {/* CINEMATIC HERO */}
        <section
          ref={heroRef}
          className="relative flex min-h-[850px] items-center overflow-hidden md:min-h-screen"
        >
          <motion.div style={{ y: bgY }} className="absolute inset-0">
            <motion.div
              initial={{ scale: 1.05 }}
              animate={{
                scale: [1.05, 1.2, 1.05],
                x: ["0%", "-2%", "0%"],
              }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-0 will-change-transform"
            >
              <div
                className="absolute inset-0 bg-cover bg-center grayscale-[35%]"
                style={{
                  backgroundImage:
                    "url('https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=2000&q=90')",
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-[#3a4250]/40 to-black/20" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30" />
            </motion.div>
          </motion.div>

          {/* editorial grid lines */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 hidden bg-[linear-gradient(to_right,rgba(255,255,255,0.09)_1px,transparent_1px)] [background-size:25%_100%] md:block"
          />

          <motion.div
            style={{ y: textY }}
            className="relative z-10 mx-auto w-full max-w-[1800px] px-6 pt-28 md:px-12"
          >
            <motion.div
              initial="hidden"
              animate="visible"
              transition={{ staggerChildren: 0.2 }}
              className="max-w-6xl"
            >
              <motion.p
                variants={reveal}
                transition={{ duration: 0.8 }}
                className={`${serif.className} mb-8 text-lg italic tracking-[0.3em] text-[#d1c4e9] md:text-xl`}
              >
                FASHION / TECHNOLOGY / IDENTITY
              </motion.p>

              <motion.h1
                variants={reveal}
                transition={{ duration: 1 }}
                className={`${display.className} text-[clamp(5.5rem,17vw,17rem)] uppercase leading-[0.82] tracking-tight`}
              >
                DEFINE
                <br />
                <span
                  className={`${serif.className} -my-[0.04em] inline-block font-light normal-case italic tracking-normal md:ml-[14vw]`}
                >
                  YOUR
                </span>
                <br />
                <span style={outline} className="md:ml-[4vw]">
                  REALITY.
                </span>
              </motion.h1>

              <motion.div
                variants={reveal}
                transition={{ duration: 0.9 }}
                className="mt-12 flex flex-col gap-8 md:flex-row md:items-end md:justify-between"
              >
                <p
                  className={`${serif.className} max-w-sm text-xl leading-8 text-white/80 md:text-2xl md:leading-9`}
                >
                  A new dimension of fashion. Discover extraordinary
                  collections and experience style powered by intelligence.
                </p>

                <Link
                  href="/shop"
                  className="group flex w-fit items-center gap-5 bg-white px-7 py-5 text-xs font-medium tracking-[0.2em] text-black transition hover:bg-[#b9a6dc]"
                >
                  SHOP THE COLLECTION
                  <ArrowUpRight
                    size={18}
                    className="transition-transform group-hover:-translate-y-1 group-hover:translate-x-1"
                  />
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* inset editorial thumbnail */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1 }}
            className="absolute bottom-24 right-6 z-10 hidden w-40 md:right-12 md:block lg:w-56"
          >
            <div
              className="aspect-[3/4] border border-white/30 bg-cover bg-center grayscale"
              style={{ backgroundImage: `url('${collections[1].image}')` }}
            />
            <motion.span
              aria-hidden
              animate={{ rotate: 360 }}
              transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
              className="absolute -left-8 -top-8 text-6xl text-white"
            >
              ✳
            </motion.span>
          </motion.div>

          <div className="absolute bottom-8 right-6 z-10 text-[10px] tracking-[0.3em] text-white/60 md:right-12">
            EST. 2026 — THE NEXT ERA
          </div>
        </section>

        {/* MARQUEE */}
        <section className="overflow-hidden border-y border-white/15">
          <div className="bg-white py-5 text-black">
            <motion.div
              animate={{ x: ["0%", "-50%"] }}
              transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
              className={`${display.className} flex w-max whitespace-nowrap text-3xl tracking-wide md:text-5xl`}
            >
              {Array.from({ length: 8 }).map((_, index) => (
                <span key={index} className="flex items-center gap-12 pr-12">
                  DON'T JUST WEAR IT
                  <Sparkles size={26} className="text-[#79668e]" />
                  EXPERIENCE IT
                  <span className="text-[#79668e]">✳</span>
                </span>
              ))}
            </motion.div>
          </div>
          <div className="py-4">
            <motion.div
              animate={{ x: ["-50%", "0%"] }}
              transition={{ duration: 34, repeat: Infinity, ease: "linear" }}
              style={outline}
              className={`${display.className} flex w-max whitespace-nowrap text-3xl tracking-wide md:text-5xl`}
            >
              {Array.from({ length: 8 }).map((_, index) => (
                <span key={index} className="flex items-center gap-12 pr-12">
                  DON'T JUST WEAR IT
                  <span>✳</span>
                  EXPERIENCE IT
                  <span>✳</span>
                </span>
              ))}
            </motion.div>
          </div>
        </section>

        {/* COLLECTIONS */}
        <section
          id="collections"
          className="mx-auto max-w-[1800px] px-6 py-28 md:px-12 md:py-40"
        >
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8 }}
            className="mb-20 flex flex-col justify-between gap-8 md:flex-row md:items-end"
          >
            <div>
              <p
                className={`${serif.className} mb-5 text-xl italic tracking-[0.25em] text-[#b9a6dc]`}
              >
                01 / THE EDIT
              </p>
              <h2
                className={`${display.className} text-[clamp(4.5rem,12vw,12rem)] uppercase leading-[0.88]`}
              >
                THE
                <br />
                <span
                  className={`${serif.className} font-light normal-case italic`}
                >
                  COLLECTIONS.
                </span>
              </h2>
            </div>

            <p
              className={`${serif.className} max-w-xs text-xl leading-8 text-white/60`}
            >
              Curated expressions of individuality. Designed to move
              beyond the ordinary.
            </p>
          </motion.div>

          <div className="grid gap-5 pb-4 md:grid-cols-12 md:pb-48">
            {collections.map((collection, index) => (
              <motion.article
                key={collection.number}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.7, delay: index * 0.15 }}
                className={`group relative aspect-[3/4] overflow-hidden bg-[#222] ${layouts[index]}`}
              >
                <div
                  className="absolute inset-0 bg-cover bg-center grayscale transition duration-1000 group-hover:scale-110 group-hover:grayscale-0"
                  style={{
                    backgroundImage: `url('${collection.image}')`,
                  }}
                />

                <Link
                  href="/shop"
                  aria-label={`Shop ${collection.title}`}
                  className="absolute inset-0 z-10"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
                <div className="absolute inset-3 border border-white/0 transition duration-500 group-hover:border-white/60" />

                <div
                  className={`${serif.className} absolute left-6 top-6 text-xl italic tracking-[0.2em]`}
                >
                  {collection.number} / 03
                </div>

                <div className="absolute bottom-0 left-0 w-full p-7">
                  <p
                    className={`${serif.className} mb-2 text-xl italic text-white/80`}
                  >
                    {collection.category}
                  </p>

                  <div className="flex items-end justify-between gap-4">
                    <h3
                      className={`${display.className} text-4xl leading-none md:text-5xl`}
                    >
                      {collection.title}
                    </h3>
                    <ArrowUpRight
                      size={28}
                      className="shrink-0 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1"
                    />
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </section>

        {/* AI EXPERIENCE */}
        <section
          id="experience"
          className="relative overflow-hidden bg-[#b9ab9a] py-28 text-[#14110e] md:py-40"
        >
          <span
            aria-hidden
            className={`${display.className} pointer-events-none absolute -left-6 -top-10 select-none text-[22vw] leading-none text-[#14110e]/[0.06]`}
          >
            TRY-ON
          </span>

          <div className="relative mx-auto grid max-w-[1800px] items-center gap-16 px-6 md:grid-cols-2 md:px-12">
            <motion.div
              initial={{ opacity: 0, x: -60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9 }}
            >
              <p
                className={`${serif.className} mb-7 flex items-center gap-3 text-xl italic tracking-[0.2em] text-[#4a3d5c]`}
              >
                <Sparkles size={17} />
                02 / INTELLIGENT FASHION
              </p>

              <h2
                className={`${display.className} text-[clamp(4.5rem,10vw,11rem)] uppercase leading-[0.88]`}
              >
                SEE IT.
                <br />
                <span
                  className={`${serif.className} font-light normal-case italic md:ml-[4vw]`}
                >
                  FEEL IT.
                </span>
                <br />
                TRY IT.
              </h2>

              <p
                className={`${serif.className} mt-10 max-w-md text-2xl leading-9 text-[#14110e]/80`}
              >
                Your next look, reimagined. Explore the future of
                virtual styling through AI-powered fashion technology.
              </p>

              <Link
                href="/tryon"
                className="group mt-10 inline-flex w-fit items-center gap-5 bg-[#14110e] px-7 py-5 text-xs font-medium tracking-[0.2em] text-white transition duration-300 hover:bg-[#4a3d5c]"
              >
                TRY VIRTUAL TRY-ON
                <ArrowUpRight
                  size={18}
                  className="transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1"
                />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="relative"
            >
              <div className="absolute -right-4 -top-4 h-full w-full border border-[#14110e]/30" />
              <div className="relative aspect-[4/5] overflow-hidden bg-[#8f8374]">
                <div
                  className="absolute inset-0 bg-cover bg-center grayscale"
                  style={{
                    backgroundImage:
                      "url('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=85')",
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

                {/* try-on scan line + viewfinder corners */}
                <motion.div
                  aria-hidden
                  animate={{ top: ["0%", "100%"] }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "linear",
                    repeatType: "reverse",
                  }}
                  className="absolute left-0 right-0 h-px bg-white shadow-[0_0_18px_4px_rgba(185,166,220,0.8)]"
                />
                <span className="absolute left-4 top-4 h-5 w-5 border-l border-t border-white" />
                <span className="absolute right-4 top-4 h-5 w-5 border-r border-t border-white" />

                <div className="absolute bottom-8 left-8 right-8 flex items-center justify-between border border-white/50 bg-black/35 p-5 text-white backdrop-blur-md">
                  <span
                    className={`${serif.className} text-xl italic tracking-[0.15em]`}
                  >
                    THE FUTURE OF TRY-ON
                  </span>
                  <Sparkles size={20} />
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* MANIFESTO */}
        <section
          id="about"
          className="mx-auto max-w-[1800px] px-6 py-32 md:px-12 md:py-48"
        >
          <motion.div
            initial={{ opacity: 0, y: 70 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            <p
              className={`${serif.className} mb-10 text-xl italic tracking-[0.3em] text-[#b9a6dc]`}
            >
              03 / OUR PHILOSOPHY
            </p>

            <h2
              ref={manifestoRef}
              className="max-w-6xl text-[clamp(3rem,7.5vw,8.5rem)] leading-[1.02]"
            >
              {manifestoA.map((word, i) => (
                <Word
                  key={`a${i}`}
                  progress={manifestoProgress}
                  range={[i / total, (i + 1) / total]}
                  className={`${display.className} uppercase`}
                >
                  {word}
                </Word>
              ))}
              {manifestoB.map((word, i) => {
                const n = manifestoA.length + i;
                return (
                  <Word
                    key={`b${i}`}
                    progress={manifestoProgress}
                    range={[n / total, (n + 1) / total]}
                    className={`${serif.className} font-light italic text-[#b9a6dc]`}
                  >
                    {word}
                  </Word>
                );
              })}
            </h2>

            <div className="mt-16 flex flex-col justify-between gap-8 border-t border-white/20 pt-8 md:flex-row md:items-center">
              <p
                className={`${serif.className} max-w-md text-xl leading-8 text-white/60`}
              >
                TRYONIX brings together modern fashion, intelligent
                technology, and individual expression.
              </p>

              <Link
                href="/register"
                className="group flex w-fit items-center gap-5 border border-white/40 px-7 py-5 text-xs font-medium tracking-[0.2em] transition hover:border-white hover:bg-white hover:text-black"
              >
                JOIN TRYONIX
                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
            </div>
          </motion.div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-white/15 bg-black px-6 pb-8 pt-20 md:px-12">
          <div className="mx-auto max-w-[1800px]">
            <div className="flex flex-col justify-between gap-12 md:flex-row">
              <div>
                <h2
                  style={outline}
                  className={`${serif.className} text-[clamp(4rem,13vw,13rem)] font-light leading-none tracking-wide`}
                >
                  TRYONIX<span className="text-[#b9a6dc]">.</span>
                </h2>
                <p
                  className={`${serif.className} mt-5 text-xl italic tracking-[0.2em] text-white/50`}
                >
                  DON'T JUST WEAR IT. EXPERIENCE IT.
                </p>
              </div>

              <div className="flex flex-col gap-4 text-xs tracking-[0.2em] text-white/60">
                <Link href="/register" className="hover:text-white">
                  CREATE ACCOUNT
                </Link>
                <Link href="/shop" className="hover:text-white">
                  SHOP ALL
                </Link>
                <Link href="/bag" className="hover:text-white">
                  SHOPPING BAG
                </Link>
                <a href="#collections" className="hover:text-white">
                  COLLECTIONS
                </a>
                <Link href="/tryon" className="hover:text-white">
                  VIRTUAL TRY-ON
                </Link>
                <a href="#experience" className="hover:text-white">
                  AI EXPERIENCE
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="hover:text-white"
                >
                  <Camera size={19} />
                </a>
              </div>
            </div>

            <div className="mt-24 flex flex-col justify-between gap-4 border-t border-white/15 pt-7 text-[10px] tracking-[0.2em] text-white/40 md:flex-row">
              <span>© {new Date().getFullYear()} TRYONIX.</span>
              <span>FASHION × INTELLIGENCE × IDENTITY</span>
            </div>
          </div>
        </footer>
      </main>
    </MotionConfig>
  );
}