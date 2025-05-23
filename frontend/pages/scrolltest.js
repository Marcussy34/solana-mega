import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Script from 'next/script';

export default function ScrollTest() {
  const [gsapLoaded, setGsapLoaded] = useState(false);
  const [observerLoaded, setObserverLoaded] = useState(false);

  useEffect(() => {
    // Only initialize GSAP when both libraries are loaded
    if (gsapLoaded && observerLoaded && typeof window !== 'undefined') {
      const initGSAP = () => {
        console.clear();
        
        const gsap = window.gsap;
        const Observer = window.Observer;
        
        const sections = gsap.utils.toArray(".slide");
        const images = gsap.utils.toArray(".image").reverse();
        const slideImages = gsap.utils.toArray(".slide__img");
        const outerWrappers = gsap.utils.toArray(".slide__outer");
        const innerWrappers = gsap.utils.toArray(".slide__inner");
        const count = document.querySelector(".count");
        const wrap = gsap.utils.wrap(0, sections.length);
        let animating;
        let currentIndex = 0;

        gsap.set(outerWrappers, { xPercent: 100 });
        gsap.set(innerWrappers, { xPercent: -100 });
        gsap.set(".slide:nth-of-type(1) .slide__outer", { xPercent: 0 });
        gsap.set(".slide:nth-of-type(1) .slide__inner", { xPercent: 0 });

        function gotoSection(index, direction) {
          animating = true;
          index = wrap(index);

          let tl = gsap.timeline({
            defaults: { duration: 1, ease: "expo.inOut" },
            onComplete: () => {
              animating = false;
            }
          });

          let currentSection = sections[currentIndex];
          let heading = currentSection.querySelector(".slide__heading");
          let nextSection = sections[index];
          let nextHeading = nextSection.querySelector(".slide__heading");

          gsap.set([sections, images], { zIndex: 0, autoAlpha: 0 });
          gsap.set([sections[currentIndex], images[index]], { zIndex: 1, autoAlpha: 1 });
          gsap.set([sections[index], images[currentIndex]], { zIndex: 2, autoAlpha: 1 });

          tl
            .set(count, { text: index + 1 }, 0.32)
            .fromTo(
              outerWrappers[index],
              {
                xPercent: 100 * direction
              },
              { xPercent: 0 },
              0
            )
            .fromTo(
              innerWrappers[index],
              {
                xPercent: -100 * direction
              },
              { xPercent: 0 },
              0
            )
            .to(
              heading,
              {
                "--width": 800,
                xPercent: 30 * direction
              },
              0
            )
            .fromTo(
              nextHeading,
              {
                "--width": 800,
                xPercent: -30 * direction
              },
              {
                "--width": 200,
                xPercent: 0
              },
              0
            )
            .fromTo(
              images[index],
              {
                xPercent: 125 * direction,
                scaleX: 1.5,
                scaleY: 1.3
              },
              { xPercent: 0, scaleX: 1, scaleY: 1, duration: 1 },
              0
            )
            .fromTo(
              images[currentIndex],
              { xPercent: 0, scaleX: 1, scaleY: 1 },
              {
                xPercent: -125 * direction,
                scaleX: 1.5,
                scaleY: 1.3
              },
              0
            )
            .fromTo(
              slideImages[index],
              {
                scale: 2
              },
              { scale: 1 },
              0
            )
            .timeScale(0.8);

          currentIndex = index;
        }

        Observer.create({
          type: "wheel,touch,pointer",
          preventDefault: true,
          wheelSpeed: -1,
          onUp: () => {
            console.log("down");
            if (animating) return;
            gotoSection(currentIndex + 1, +1);
          },
          onDown: () => {
            console.log("up");
            if (animating) return;
            gotoSection(currentIndex - 1, -1);
          },
          tolerance: 10
        });

        function logKey(e) {
          console.log(e.code);
          if ((e.code === "ArrowUp" || e.code === "ArrowLeft") && !animating) {
            gotoSection(currentIndex - 1, -1);
          }
          if (
            (e.code === "ArrowDown" ||
              e.code === "ArrowRight" ||
              e.code === "Space" ||
              e.code === "Enter") &&
            !animating
          ) {
            gotoSection(currentIndex + 1, 1);
          }
        }

        document.addEventListener("keydown", logKey);
        
        // Return cleanup function
        return () => {
          document.removeEventListener("keydown", logKey);
        };
      };
      
      // Call initialization
      const cleanup = initGSAP();
      
      // Cleanup when unmounting
      return cleanup;
    }
  }, [gsapLoaded, observerLoaded]);

  return (
    <>
      <Head>
        <title>Scroll Test</title>
        <link href="https://fonts.googleapis.com/css2?family=Sora&display=swap" rel="stylesheet" />
      </Head>
      
      <Script 
        src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.11.5/gsap.min.js"
        strategy="afterInteractive"
        onLoad={() => setGsapLoaded(true)}
      />
      <Script 
        src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.11.5/Observer.min.js"
        strategy="afterInteractive"
        onLoad={() => setObserverLoaded(true)}
      />

      <style jsx global>{`
        @font-face {
          font-family: "Bandeins Sans & Strange Variable";
          src: url("https://res.cloudinary.com/dldmpwpcp/raw/upload/v1566406079/BandeinsStrangeVariable_esetvq.ttf");
        }
        
        * {
          box-sizing: border-box;
          user-select: none;
        }
        
        ::-webkit-scrollbar {
          display: none;
        }
        
        figure {
          margin: 0;
          overflow: hidden;
        }
        
        html,
        body {
          overflow: hidden;
          margin: 0;
          padding: 0;
          height: 100vh;
          height: -webkit-fill-available;
        }
        
        body {
          color: #fff;
          background: #4361ee;
          font-family: "Sora", sans-serif;
        }
        
        footer {
          position: fixed;
          z-index: 999;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 2rem;
          width: 100%;
          height: 7em;
          font-family: "Sora", sans-serif;
          font-size: clamp(1.2rem, 2vw, 1rem);
        }
        
        a {
          color: #fff;
          text-decoration: none;
        }
        
        .slide {
          height: 100%;
          width: 100%;
          top: 0;
          position: fixed;
          visibility: hidden;
        }
        
        .slide__outer,
        .slide__inner {
          width: 100%;
          height: 100%;
          overflow-y: hidden;
        }
        
        .slide__content {
          display: flex;
          align-items: center;
          justify-content: center;
          position: absolute;
          height: 100%;
          width: 100%;
          top: 0;
        }
        
        .slide__container {
          position: relative;
          max-width: 1400px;
          width: 100vw;
          margin: 0 auto;
          height: 90vh;
          margin-bottom: 10vh;
          display: grid;
          grid-template-columns: repeat(10, 1fr);
          grid-template-rows: repeat(10, 1fr);
          grid-column-gap: 0px;
          grid-row-gap: 0px;
          padding: 0 1rem;
        }
        
        .slide__heading {
          --width: 200;
          display: block;
          text-align: left;
          font-family: "Bandeins Sans & Strange Variable";
          font-size: clamp(5rem, 15vw, 15rem);
          font-weight: 900;
          font-variation-settings: "wdth" var(--width);
          margin: 0;
          padding: 0;
          color: #f2f1fc;
          z-index: 999;
          mix-blend-mode: difference;
          grid-area: 2 / 2 / 3 / 10;
          align-self: end;
        }
        
        .slide__img-cont {
          margin-top: 4rem;
          grid-area: 2 / 1 / 7 / 8;
        }
        
        .slide__img-cont img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .slide:nth-of-type(1) {
          visibility: visible;
        }
        
        .slide:nth-of-type(1) .slide__content {
          background-color: #6d597a;
        }
        
        .slide:nth-of-type(2) .slide__content {
          background-color: #355070;
        }
        
        .slide:nth-of-type(3) .slide__content {
          background-color: #b56576;
        }
        
        .slide:nth-of-type(4) .slide__content {
          background-color: #9a8c98;
        }
        
        .overlay {
          position: fixed;
          top: 0;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 2;
        }
        
        .overlay__content {
          max-width: 1400px;
          width: 100vw;
          margin: 0 auto;
          padding: 0 1rem;
          height: 90vh;
          margin-bottom: 10vh;
          display: grid;
          grid-template-columns: repeat(10, 1fr);
          grid-template-rows: repeat(10, 1fr);
          grid-column-gap: 0px;
          grid-row-gap: 0px;
        }
        
        .overlay__img-cont {
          position: relative;
          overflow: hidden;
          margin: 0;
          grid-area: 4 / 3 / 9 / 11;
        }
        
        .overlay__img-cont img {
          position: absolute;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: 50% 50%;
        }
        
        .overlay__count {
          grid-area: 3 / 10 / 4 / 10;
          font-size: clamp(3rem, 4vw, 15rem);
          margin: 0;
          padding: 0;
          text-align: right;
          border-bottom: 7px white solid;
        }
        
        @media screen and (min-width: 900px) {
          .overlay__content,
          .slide__container {
            padding: 0 3rem;
            margin-top: 10vh;
            height: 80vh;
          }
        
          .overlay__img-cont {
            grid-area: 5 / 4 / 10 / 11;
          }
        
          .overlay__count {
            grid-area: 3 / 10 / 4 / 11;
          }
        
          .slide__img-cont {
            margin-top: 0;
            grid-area: 3 / 2 / 8 / 7;
          }
        
          .slide__heading {
            grid-area: 1 / 1 / 4 / 10;
          }
        }
        
        .slide__subtitle {
          color: #f2f1fc;
          font-size: clamp(1rem, 2vw, 1.5rem);
          font-weight: 300;
          margin: 0;
          margin-top: -20px;
          margin-left: 10px;
          padding: 0;
          grid-area: 3 / 2 / 4 / 10;
          z-index: 999;
          mix-blend-mode: difference;
        }
        
        .solana-logo {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .solana-logo span {
          font-size: 0.9rem;
          font-weight: 300;
          letter-spacing: 1px;
        }
      `}</style>

      <section className="slide">
        <div className="slide__outer">
          <div className="slide__inner">
            <div className="slide__content">
              <div className="slide__container">
                <h2 className="slide__heading">WEB3</h2>
                <p className="slide__subtitle">The Future of Finance</p>
                <figure className="slide__img-cont">
                  <img className="slide__img" src='https://images.unsplash.com/photo-1567016376408-0226e4d0c1ea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwxNDU4OXwwfDF8cmFuZG9tfHx8fHx8fHx8MTY0NjMyMDUzOA&ixlib=rb-1.2.1&q=80&w=400' alt='' />
                </figure>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="slide">
        <div className="slide__outer">
          <div className="slide__inner">
            <div className="slide__content">
              <div className="slide__container">
                <h2 className="slide__heading">CRYPTO</h2>
                <p className="slide__subtitle">Decentralized Innovation</p>
                <figure className="slide__img-cont">
                  <img className="slide__img" src='https://images.unsplash.com/photo-1558603668-6570496b66f8?crop=entropy&cs=srgb&fm=jpg&ixid=MnwxNDU4OXwwfDF8cmFuZG9tfHx8fHx8fHx8MTY0NjMyMDUzOA&ixlib=rb-1.2.1&q=85&w=400' alt='' />
                </figure>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="slide">
        <div className="slide__outer">
          <div className="slide__inner">
            <div className="slide__content">
              <div className="slide__container">
                <h2 className="slide__heading">BLOCKCHAIN</h2>
                <p className="slide__subtitle">Secure and Transparent</p>
                <figure className="slide__img-cont">
                  <img className="slide__img" src='https://images.unsplash.com/photo-1537165924986-cc3568f5d454?crop=entropy&cs=srgb&fm=jpg&ixid=MnwxNDU4OXwwfDF8cmFuZG9tfHx8fHx8fHx8MTY0NjMyMDU4NA&ixlib=rb-1.2.1&q=85&w=400' alt='' />
                </figure>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="slide">
        <div className="slide__outer">
          <div className="slide__inner">
            <div className="slide__content">
              <div className="slide__container">
                <h2 className="slide__heading">SOLANA</h2>
                <p className="slide__subtitle">Fast, Secure, Scalable</p>
                <figure className="slide__img-cont">
                  <img className="slide__img" src='https://images.unsplash.com/photo-1589271243958-d61e12b61b97?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwxNDU4OXwwfDF8cmFuZG9tfHx8fHx8fHx8MTY0NjMyMDU4NA&ixlib=rb-1.2.1&q=80&w=400' alt='' />
                </figure>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="overlay">
        <div className="overlay__content">
          <p className="overlay__count">0<span className="count">1</span></p>
          <figure className="overlay__img-cont">
            <img className="image" src="https://images.unsplash.com/photo-1519710164239-da123dc03ef4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwxNDU4OXwwfDF8cmFuZG9tfHx8fHx8fHx8MTY0NjMxOTU4Mw&ixlib=rb-1.2.1&q=80&w=800" />
            <img className="image" src="https://images.unsplash.com/photo-1594666757003-3ee20de41568?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwxNDU4OXwwfDF8cmFuZG9tfHx8fHx8fHx8MTY0NjMxOTcwOA&ixlib=rb-1.2.1&q=80&w=800" />
            <img className="image" src="https://images.unsplash.com/photo-1579830341096-05f2f31b8259?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwxNDU4OXwwfDF8cmFuZG9tfHx8fHx8fHx8MTY0NjMxOTQ5Ng&ixlib=rb-1.2.1&q=80&w=800" />
            <img className="image" src="https://images.unsplash.com/photo-1603771628302-c32c88e568e3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwxNDU4OXwwfDF8cmFuZG9tfHx8fHx8fHx8MTY0NjMxOTUxNg&ixlib=rb-1.2.1&q=80&w=800" />
          </figure>
        </div>
      </section>

      <footer>
        <div className="solana-logo">
          <img src="https://solana.com/_next/static/media/logotype.e4df684f.svg" alt="Solana" height="20" />
          <span>Powered by Solana</span>
        </div>
        <p>Blockchain for the Next Generation</p>
      </footer>
    </>
  );
}
