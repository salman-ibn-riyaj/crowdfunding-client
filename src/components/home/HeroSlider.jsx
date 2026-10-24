"use client";

import { useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { A11y, Autoplay, Keyboard } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { FiArrowRight, FiChevronLeft, FiChevronRight } from "react-icons/fi";

const subscribeToHydration = () => () => { };
const getClientReady = () => true;
const getServerReady = () => false;

function subscribeToMotionPreference(onChange) {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    preference.addEventListener("change", onChange);
    return () => preference.removeEventListener("change", onChange);
}

const getReducedMotionPreference = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const getServerReducedMotionPreference = () => true;

export default function HeroSlider({ slides }) {
    const [swiper, setSwiper] = useState(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const reducedMotion = useSyncExternalStore(
        subscribeToMotionPreference,
        getReducedMotionPreference,
        getServerReducedMotionPreference,
    );
    const isReady = useSyncExternalStore(subscribeToHydration, getClientReady, getServerReady);
    const stopAutoplay = () => swiper?.autoplay?.stop();

    function navigate(direction) {
        stopAutoplay();
        if (direction === "previous") swiper?.slidePrev();
        if (direction === "next") swiper?.slideNext();
    }

    if (!isReady) {
        const firstSlide = slides[0];

        return (
            <section aria-label="Featured campaign stories" className="hero-slider">
                <article className="hero-slide">
                    <Image
                        alt={firstSlide.imageAlt}
                        className="hero-slide__image"
                        fill
                        priority
                        sizes="100vw"
                        src={firstSlide.image}
                    />
                    <div className="hero-slide__shade" />
                    <div className="hero-slide__content">
                        <p className="hero-slide__label">{firstSlide.label}</p>
                        <h1 className="hero-slide__title">{firstSlide.title}</h1>
                        <p className="hero-slide__description">{firstSlide.description}</p>
                        <Link className="hero-slide__cta" href="/campaigns">
                            Explore campaigns <FiArrowRight aria-hidden="true" />
                        </Link>
                    </div>
                </article>
            </section>
        );
    }

    return (
        <section
            aria-label="Featured campaign stories"
            className="hero-slider"
            onFocusCapture={stopAutoplay}
        >
            <Swiper
                aria-roledescription="carousel"
                autoplay={reducedMotion ? false : {
                    delay: 6200,
                    disableOnInteraction: true,
                    pauseOnMouseEnter: true,
                }}
                className="hero-slider__swiper"
                keyboard={{ enabled: true, onlyInViewport: true }}
                loop
                modules={[A11y, Autoplay, Keyboard]}
                onSlideChange={(instance) => setActiveIndex(instance.realIndex)}
                onSwiper={setSwiper}
                slidesPerView={1}
                speed={550}
            >
                {slides.map((slide, index) => {
                    const Heading = index === 0 ? "h1" : "h2";

                    return (
                        <SwiperSlide key={slide.title}>
                            <article className="hero-slide">
                                <Image
                                    alt={slide.imageAlt}
                                    className="hero-slide__image"
                                    fill
                                    priority={index === 0}
                                    sizes="100vw"
                                    src={slide.image}
                                />
                                <div className="hero-slide__shade" />
                                <div className="hero-slide__content">
                                    <p className="hero-slide__label">{slide.label}</p>
                                    <Heading className="hero-slide__title">{slide.title}</Heading>
                                    <p className="hero-slide__description">{slide.description}</p>
                                    <Link className="hero-slide__cta" href="/campaigns">
                                        Explore campaigns <FiArrowRight aria-hidden="true" />
                                    </Link>
                                </div>
                            </article>
                        </SwiperSlide>
                    );
                })}
            </Swiper>

            <div aria-label="Hero slide controls" className="hero-slider__controls">
                <button
                    aria-label="Previous banner"
                    className="hero-slider__arrow"
                    onClick={() => navigate("previous")}
                    type="button"
                >
                    <FiChevronLeft aria-hidden="true" />
                </button>
                <div aria-label="Choose a banner" className="hero-slider__indicators" role="group">
                    {slides.map((slide, index) => (
                        <button
                            aria-current={activeIndex === index ? "true" : undefined}
                            aria-label={`Show banner ${index + 1}: ${slide.title}`}
                            className={`hero-slider__indicator${activeIndex === index ? " is-active" : ""}`}
                            key={slide.title}
                            onClick={() => {
                                stopAutoplay();
                                swiper?.slideToLoop(index);
                            }}
                            type="button"
                        />
                    ))}
                </div>
                <span aria-live="polite" className="hero-slider__count">
                    {String(activeIndex + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
                </span>
                <button
                    aria-label="Next banner"
                    className="hero-slider__arrow"
                    onClick={() => navigate("next")}
                    type="button"
                >
                    <FiChevronRight aria-hidden="true" />
                </button>
            </div>
        </section>
    );
}