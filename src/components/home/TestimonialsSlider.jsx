"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { A11y, Keyboard } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { FiChevronLeft, FiChevronRight, FiMessageSquare } from "react-icons/fi";

function TestimonialCard({ testimonial }) {
  return (
    <figure className="testimonial-card">
      <FiMessageSquare aria-hidden="true" className="testimonial-card__quote-mark" />
      <blockquote>{testimonial.quote}</blockquote>
      <figcaption>
        <Image alt="" height={48} src={testimonial.image} width={48} />
        <span>
          <strong>{testimonial.name}</strong>
          <small>{testimonial.role}</small>
        </span>
      </figcaption>
    </figure>
  );
}

export default function TestimonialsSlider({ testimonials }) {
  const [swiper, setSwiper] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => setIsReady(true), []);

  return (
    <section aria-labelledby="testimonials-title" className="home-section testimonials-section home-reveal">
      <div className="section-heading section-heading--split">
        <div>
          <p className="section-eyebrow">Sample testimonials</p>
          <h2 id="testimonials-title">What backing an idea can feel like.</h2>
        </div>
        {isReady ? (
          <div aria-label="Testimonial controls" className="testimonial-controls">
            <button
              aria-label="Previous testimonial"
              aria-controls="testimonials-slider"
              className="testimonial-controls__button"
              onClick={() => swiper?.slidePrev()}
              type="button"
            >
              <FiChevronLeft aria-hidden="true" />
            </button>
            <button
              aria-label="Next testimonial"
              aria-controls="testimonials-slider"
              className="testimonial-controls__button"
              onClick={() => swiper?.slideNext()}
              type="button"
            >
              <FiChevronRight aria-hidden="true" />
            </button>
          </div>
        ) : null}
      </div>
      {!isReady && (
        <div className="testimonial-preview-grid">
          {testimonials.map((testimonial) => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} />
          ))}
        </div>
      )}
      {isReady && (
      <Swiper
        aria-roledescription="carousel"
        breakpoints={{
          640: { slidesPerView: 2, spaceBetween: 18 },
          1024: { slidesPerView: 3, spaceBetween: 22 },
        }}
        id="testimonials-slider"
        keyboard={{ enabled: true, onlyInViewport: true }}
        modules={[A11y, Keyboard]}
        onSwiper={setSwiper}
        slidesPerView={1.12}
        spaceBetween={14}
      >
        {testimonials.map((testimonial) => (
          <SwiperSlide key={testimonial.id}>
            <TestimonialCard testimonial={testimonial} />
          </SwiperSlide>
        ))}
      </Swiper>
      )}
    </section>
  );
}