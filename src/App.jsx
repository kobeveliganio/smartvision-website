import React, { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom"; // ✅ Add useNavigate here
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./App.css";




export default function App() {
  const navigate = useNavigate();
  useEffect(() => {
    // Navbar scroll effect
    const handleScroll = () => {
      const navbar = document.querySelector(".smart-nav");
      if (navbar) {
        navbar.classList.toggle("scrolled", window.scrollY > 50);
      }

      fadeElements.forEach(el => {
        const rect = el.getBoundingClientRect().top;
        if (rect < window.innerHeight - 100) el.classList.add("visible");
      });
    };

    const fadeElements = document.querySelectorAll(".fade-in");
    window.addEventListener("scroll", handleScroll);
    handleScroll();

    // Active nav underline
    const navLinks = document.querySelectorAll(".navbar-nav .nav-link");
    navLinks.forEach(link => {
      link.addEventListener("click", function () {
        navLinks.forEach(l => l.classList.remove("active-link"));
        this.classList.add("active-link");
      });
    });

    // Demo login/signup alerts
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");

    if (loginForm) {
      loginForm.addEventListener("submit", e => {
        e.preventDefault();
        alert("Login successful! (Demo only)");
      });
    }

    if (signupForm) {
      signupForm.addEventListener("submit", e => {
        e.preventDefault();
        alert("Account created successfully! (Demo only)");
      });
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark fixed-top smart-nav">
        <div className="container-fluid px-4">
          <a className="navbar-brand d-flex align-items-center" href="#">
            <img src="/logoname.png" alt="SmartVision Logo" className="navbar-logo me-2" />
          </a>
          <button
            className="navbar-toggler border-0 shadow-none"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
            <ul className="navbar-nav align-items-center gap-2">
              <li className="nav-item"><a className="nav-link active-link" href="#about">About</a></li>
              <li className="nav-item"><a className="nav-link" href="#technology">Technology</a></li>
              <li className="nav-item"><a className="nav-link" href="#mission">Mission</a></li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero text-center position-relative">
        <img src="/bg.JPEG" alt="SmartVision Background" className="hero-bg" />
        <div className="overlay"></div>
        <div className="container position-relative">
          <h1 className="display-5 fw-bold mb-3 hero-title">
            <span className="text-primary-part">Smart</span>
            <span className="text-highlight-part">Vision</span>: Empowering the Visually Impaired through Technology
          </h1>
          <p className="lead mb-4">
            A mobile application that interprets Braille text into readable and audible formats using image processing.
          </p>
          <div>
            <button
              onClick={() => navigate("/login")}
              className="btn btn-warning btn-lg"
            >
              Get Started
            </button>

          </div>
        </div>
      </section>


      {/* About Section */}
      <section id="about" className="py-5 bg-light text-center fade-in">
        <div className="container">
          <h2 className="section-title mb-4">About SmartVision</h2>
          <p className="lead text-muted">
            SmartVision is an assistive mobile application that uses advanced image processing and machine learning to translate Braille characters into text or speech. Designed for both students and educators, the app promotes accessibility, inclusivity, and equal learning opportunities for visually impaired individuals.
          </p>
        </div>
      </section>

      {/* Technology Section */}
      <section id="technology" className="py-5 text-center fade-in">
        <div className="container">
          <h2 className="section-title mb-5">Powered by Intelligent Technology</h2>
          <div className="row g-4">
            <div className="col-md-4">
              <div className="feature-card">
                <h5 className="fw-bold text-primary mb-2">Image Processing</h5>
                <p>Utilizes preprocessing techniques for accurate Braille recognition under various lighting conditions.</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="feature-card">
                <h5 className="fw-bold text-primary mb-2">Machine Learning (CNN)</h5>
                <p>Uses CNNs to detect Braille dot patterns and translate them into readable or audible formats.</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="feature-card">
                <h5 className="fw-bold text-primary mb-2">Agile Development</h5>
                <p>Ensures continuous user feedback and accessibility improvements through agile methodology.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section id="mission" className="py-5 bg-light text-center fade-in">
        <div className="container">
          <h2 className="section-title mb-4">Our Mission</h2>
          <p className="lead text-muted">
            SmartVision aims to bridge the communication gap between the visually impaired and educators by creating a tool that is fast, accurate, and inclusive.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center">
        <p className="mb-0">© 2025 <span className="fw-semibold">SmartVision</span>. All rights reserved.</p>
      </footer>
    </>
  );
}
