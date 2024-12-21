import React from 'react';
import { Link, useHistory } from 'react-router-dom';
import Header from '../Header/Header';
import { FaXRay, FaFileMedical, FaArrowRight, FaCheckCircle, FaClock, FaShieldAlt } from 'react-icons/fa';
import { BsGraphUp } from 'react-icons/bs';
import './services.css';

const Services = () => {
    const history = useHistory();

    const handleAnalyseClick = () => {
        history.push('/analyse-report');
    };

    return (
        <div className="home-page">
            <Header />
            
            <div className="second-container">
                <div className="content-wrapper">
                    <div className="desc-container">
                        <div className="badge">AI-Powered Healthcare</div>
                        <h1 className="home-con-heading">
                            Advanced Medical<br/>
                            <span className="gradient-text">Diagnostic Services</span>
                        </h1>
                        <p className="home-con-description">
                            Experience next-generation healthcare with our AI-powered diagnostic solutions. 
                            Get instant, accurate analyses for your medical reports and X-rays.
                        </p>
                        <div className="stats-row">
                            <div className="stat-item">
                                <span className="stat-number">99%</span>
                                <span className="stat-label">Accuracy</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">24/7</span>
                                <span className="stat-label">Available</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">1M+</span>
                                <span className="stat-label">Analysis Done</span>
                            </div>
                        </div>
                    </div>
                    <div className="image-container">
                        <div className="image-wrapper">
                            <img 
                                className="second-container-image" 
                                src="https://res.cloudinary.com/dbroxheos/image/upload/v1727800728/Half_design_794_x_1012_px_flwz3e.png" 
                                alt="Services Illustration"
                            />
                            <div className="floating-card card-1">
                                <FaCheckCircle className="card-icon" />
                                <span>Instant Results</span>
                            </div>
                            <div className="floating-card card-2">
                                <BsGraphUp className="card-icon" />
                                <span>99% Accuracy</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="key-features-container">
                <div className="features-header">
                    <h1 className="features-heading">Our Diagnostic Solutions</h1>
                    <p className="feature-description">
                        Choose from our comprehensive range of AI-powered diagnostic services
                    </p>
                </div>
                
                <div className="main-icons-container">
                    <Link to="/x-ray-reports" className="icons-containers">
                        <div className="service-content">
                            <div className="icon-wrapper">
                                <FaXRay className="features-icons" />
                            </div>
                            <h1 className="icons-heading">X-Ray Analysis</h1>
                            <p className="icons-paragraph">
                                Advanced AI-powered X-ray interpretation with instant results and detailed insights
                            </p>
                            <ul className="service-features">
                                <li><FaCheckCircle /> Instant Analysis</li>
                                <li><FaClock /> 24/7 Available</li>
                                <li><FaShieldAlt /> Secure & Private</li>
                            </ul>
                            <div className="service-cta">
                                <span>Analyze Now</span>
                                <FaArrowRight className="arrow-icon" />
                            </div>
                        </div>
                    </Link>
                    <Link to="/analyse-report" className="icons-containers">
                        <div className="service-content">
                            <div className="icon-wrapper">
                                <FaFileMedical className="features-icons" />
                            </div>
                            <h1 className="icons-heading">Medical Report Analysis</h1>
                            <p className="icons-paragraph">
                                Comprehensive medical report analysis with support for multiple languages
                            </p>
                            <ul className="service-features">
                                <li><FaCheckCircle /> Multi-language Support</li>
                                <li><FaClock /> Real-time Processing</li>
                                <li><FaShieldAlt /> Data Protection</li>
                            </ul>
                            <div className="service-cta" onClick={handleAnalyseClick}>
                                <span>Analyze Now</span>
                                <FaArrowRight className="arrow-icon" />
                            </div>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Services;