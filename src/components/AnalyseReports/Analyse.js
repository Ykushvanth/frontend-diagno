import React from 'react';
import { Link } from "react-router-dom";
import Header from "../Header/Header";
import { FiUpload } from 'react-icons/fi';
import "./Analyse.css";
import { Oval } from 'react-loader-spinner';

const languages = [
    { id: "english", language: "English" },
    { id: "telugu", language: "Telugu / తెలుగు" },
    { id: "hindi", language: "Hindi / हिंदी" },
    { id: "tamil", language: "Tamil / தமிழ்" },
    { id: "kannada", language: "Kannada / ಕನ್ನಡ" },
    { id: "malayalam", language: "Malayalam / മലയാളം" },
    { id: "marathi", language: "Marathi / मराठी" },
    { id: "bengali", language: "Bengali / বাংলা" },
    { id: "gujarati", language: "Gujarati / ગુજરાતી" },
    { id: "punjabi", language: "Punjabi / ਪੰਜਾਬੀ" }
];

class Analyse extends React.Component {
    state = {
        languages: languages,
        selectedLanguage: "english",
        file: null,
        result: null,
        error: null,
        loading: false,
        recommendedSpecialist: null,
    };

    handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            this.setState({ file, error: null });
        } else {
            this.setState({ error: "Please select a file." });
        }
    };

    handleLanguageChange = (e) => {
        this.setState({ selectedLanguage: e.target.value });
    };

    handleSubmit = async (e) => {
        e.preventDefault();
        const { file, selectedLanguage } = this.state;

        if (!file) {
            this.setState({ error: "Please upload a file." });
            return;
        }

        this.setState({ error: null, loading: true, result: null });
      
        const formData = new FormData();
        formData.append('file', file);
        formData.append('language', selectedLanguage);

        try {
            const response = await fetch('http://localhost:3008/api/analyze', {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json',
                },
                mode: 'cors',
                credentials: 'omit'
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to analyze report');
            }

            if (data && data.success) {
                const { formattedOutput } = data;
                
                // Extract specialist from the analysis
                const specialistMatch = formattedOutput.match(/5\.\s*Recommended\s*Specialist:\s*([^:\n]+)/i);
                const specialist = specialistMatch ? specialistMatch[1].trim() : null;
                
                this.setState({ 
                    result: formattedOutput,
                    recommendedSpecialist: specialist,
                    error: null, 
                    loading: false 
                });
            } else {
                throw new Error(data.error || 'Failed to analyze report');
            }
        } catch (error) {
            console.error('Error:', error);
            this.setState({ 
                error: error.message || 'Error analyzing report', 
                loading: false 
            });
        }
    };

    render() {
        const { languages, selectedLanguage, result, error, loading, recommendedSpecialist } = this.state;

        return (
            <>
                <Header />
                <div className="report-cont">
                    <div className="container-for-report">
                        <form onSubmit={this.handleSubmit}>
                            <div className="files">
                                <div className="file-upload-container">
                                    <label htmlFor="file-upload" className="custom-file-upload">
                                        <FiUpload className="upload-icon" />
                                        Upload Your Report
                                    </label>
                                    <input
                                        id="file-upload"
                                        className="file"
                                        type="file"
                                        accept="image/*"
                                        onChange={this.handleFileChange}
                                    />
                                </div>

                                <div className="language-dropdown-container">
                                    <label htmlFor="language-select">Choose a language:</label>
                                    <select
                                        id="language-select"
                                        value={selectedLanguage}
                                        onChange={this.handleLanguageChange}
                                        className="language-dropdown"
                                    >
                                        {languages.map((lang) => (
                                            <option key={lang.id} value={lang.id}>
                                                {lang.language}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {error && <p className="error-message">{error}</p>}

                            {this.state.file && (
                                <div className="proceed-button-container">
                                    <button className="proceed-button" type="submit" disabled={loading}>
                                        {loading ? 'Processing...' : 'Proceed'}
                                    </button>
                                </div>
                            )}
                        </form>

                        {loading && (
                            <div className="loader-container">
                                <Oval
                                    height={80}
                                    width={80}
                                    color="#4fa94d"
                                    secondaryColor="#4fa94d"
                                    strokeWidth={2}
                                    strokeWidthSecondary={2}
                                />
                            </div>
                        )}

                        {result && (
                            <div className="result-container">
                                <h2 className="result-heading">Medical Report Analysis</h2>
                                <div className="result-sections">
                                    {result.split(/(?=\d\.\s+(?:Symptoms|Diagnosis|Severity|Treatment|Recommended))/)
                                        .filter(section => section.trim())
                                        .map((section, index) => {
                                            const [title, ...content] = section.split('\n');
                                            return (
                                                <div key={index} className="analysis-block">
                                                    <div className="section-title">
                                                        <span className="section-number">{index + 1}</span>
                                                        <span>{title.replace(/^\d\.\s*/, '').trim()}</span>
                                                    </div>
                                                    <div className="section-content">
                                                        {content.join('\n').trim()}
                                                    </div>
                                                </div>
                                            );
                                    })}
                                </div>
                                {recommendedSpecialist && (
                                    <div className="book-appointment">
                                        <button className="appointment-btn">
                                            <i className="fas fa-calendar-alt"></i>
                                            Book Appointment with {recommendedSpecialist}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </>
        );
    }
}

export default Analyse;