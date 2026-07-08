'use client';

import React, { useState, useEffect, useRef } from 'react';

interface ChatMessage {
  text: string;
  sender: 'bot' | 'user';
}

export default function Home() {
  // Navigation & UI state
  const [activeSection, setActiveSection] = useState('hero');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [showLoader, setShowLoader] = useState(true);
  
  // Contact Form state
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formSending, setFormSending] = useState(false);

  // Chatbot state
  // 'minimized' triggers the floating bubble; 'normal' is default centered; 'maximized' is full console; 'floating' overlays anywhere
  const [chatState, setChatState] = useState<'normal' | 'minimized' | 'maximized' | 'floating'>('normal');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      text: "__WELCOME_CARD__",
      sender: 'bot'
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);
  const chatMessagesContainerRef = useRef<HTMLDivElement>(null);

  // Typewriter Hero title state
  const [typedText, setTypedText] = useState('Data Professional');
  const roles = [
    'AI Engineer',
    'AI Data Analyst',
    'Power Platform Developer',
    'Data Engineer',
    'Business Intelligence Expert'
  ];

  // Typing effect hook
  useEffect(() => {
    let roleIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typingSpeed = 100;
    let timer: NodeJS.Timeout;

    function typeLoop() {
      const currentRole = roles[roleIndex];
      
      if (isDeleting) {
        setTypedText(currentRole.substring(0, charIndex - 1));
        charIndex--;
        typingSpeed = 50;
      } else {
        setTypedText(currentRole.substring(0, charIndex + 1));
        charIndex++;
        typingSpeed = 100;
      }

      if (!isDeleting && charIndex === currentRole.length) {
        isDeleting = true;
        typingSpeed = 2000;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        roleIndex = (roleIndex + 1) % roles.length;
        typingSpeed = 500;
      }

      timer = setTimeout(typeLoop, typingSpeed);
    }

    timer = setTimeout(typeLoop, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Header scroll detection & scroll spy
  useEffect(() => {
    const handleScroll = () => {
      // Header solid color transition
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }

      // Sticky chat bar visibility
      if (window.scrollY > 600) {
        setShowStickyBar(true);
      } else {
        setShowStickyBar(false);
        setChatState(prev => (prev === 'floating' || prev === 'minimized') ? 'normal' : prev);
      }

      // Scroll Spy
      const sections = document.querySelectorAll('section');
      const scrollPos = window.scrollY + 180;
      sections.forEach((section) => {
        const id = section.getAttribute('id');
        const top = section.offsetTop;
        const height = section.clientHeight;
        if (id && scrollPos >= top && scrollPos < top + height) {
          setActiveSection(id);
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle intro splash screen loader timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoader(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Scroll reveal setup (simple React implementation)
  useEffect(() => {
    const revealElements = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealElements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Auto-scroll chat to bottom — scroll ONLY the messages container, never the page
  useEffect(() => {
    const container = chatMessagesContainerRef.current;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }
  }, [chatMessages, isTyping]);



  // Contact Form submit logic
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSending(true);

    const formEndpoint = process.env.NEXT_PUBLIC_FORMSPREE_ENDPOINT || "https://formspree.io/f/mdarvdvy";
    
    if (formEndpoint === "https://formspree.io/f/placeholder") {
      setTimeout(() => {
        setFormSending(false);
        setFormSubmitted(true);
        console.warn("Please configure NEXT_PUBLIC_FORMSPREE_ENDPOINT in Vercel to receive real emails.");
      }, 1500);
      return;
    }

    try {
      const response = await fetch(formEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formName,
          email: formEmail,
          subject: formSubject,
          message: formMessage,
        }),
      });

      if (response.ok) {
        setFormSubmitted(true);
      } else {
        alert("Oops! There was a problem submitting your form.");
      }
    } catch (error) {
      alert("Oops! There was a problem submitting your form.");
    } finally {
      setFormSending(false);
    }
  };

  // Chatbot response generator — grounded knowledge base
  const getBotResponse = (input: string): string => {
    const raw = input.toLowerCase();
    const text = raw.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");

    // Smart match: short words use word-boundary (\b) to avoid 'yo' matching 'you',
    // 'hi' matching 'ashwin', etc. Phrases and longer words use substring.
    const has = (word: string): boolean => {
      const trimmed = word.trim();
      if (trimmed.includes(' ')) return text.includes(trimmed);        // multi-word phrase
      if (trimmed.length <= 4) return new RegExp(`\\b${trimmed}\\b`).test(text); // short word: whole-word only
      return text.includes(trimmed);                                    // longer word: substring ok
    };
    const hasAny = (arr: string[]) => arr.some(w => has(w));

    // === OFF-TOPIC GUARD ===
    // Detect when user is asking about completely unrelated topics
    const offTopicKeywords = [
      'weather', 'news', 'sports', 'recipe', 'cook', 'movie', 'film',
      'celebrity', 'politics', 'president', 'game', 'gaming', 'stock', 'crypto',
      'bitcoin', 'finance', 'travel', 'hotel', 'flight', 'math problem', 'calculate',
      'write me', 'write a poem', 'joke', 'story', 'translate', 'what is the capital',
      'who invented', 'explain quantum', 'define', 'wikipedia', 'search',
      'chatgpt', 'openai', 'ai help', 'homework', 'essay',
    ];
    if (hasAny(offTopicKeywords)) {
      const offTopicReplies = [
        "😊 I'm Ashwin's dedicated AI assistant — I can only share information about Ashwin. Try asking me about his projects, skills, or experience!",
        "🤖 That's outside my knowledge base! I'm only trained on Ashwin's professional profile. Ask me about his skills, background, or how to contact him.",
        "I appreciate the curiosity, but I can only tell you about Ashwin Santhanakrishnan! Try: 'What projects has he built?' or 'What are his skills?'",
      ];
      return offTopicReplies[Math.floor(Math.random() * offTopicReplies.length)];
    }

    // === GREETINGS ===
    if (hasAny(['hi', 'hello', 'hey', 'greetings', 'welcome', 'yo', 'sup', 'good morning', 'good afternoon', 'howdy'])) {
      return "Hello! 👋 I'm Ashwin's AI Assistant, trained on his professional profile. I can tell you about his projects, skills, work experience, education, and more. What would you like to know?";
    }

    // === WHO IS ASHWIN / ABOUT / GENERAL ===
    if (hasAny(['who is ashwin', 'tell me about ashwin', 'about ashwin', 'introduce', 'who are you', 'what do you do', 'summary', 'background', 'overview'])) {
      return "Ashwin Santhanakrishnan is a **Data Professional & Power Platform Developer** based in the Washington D.C. area. He holds an MS in Data Analytics from Catholic University of America and a BS in Computer Engineering from SUNY. He specializes in AI data analysis, Power BI dashboards, Power Apps development, Python ETL pipelines, and machine learning. He has worked on government data applications at NIH and e-commerce analytics roles. He's also an active user of AI tools like Cursor AI, Claude AI, and n8n.";
    }

    // === PROJECTS ===
    if (hasAny(['project', 'projects', 'built', 'what have you built', 'portfolio', 'work', 'github', 'repo', 'code'])) {
      if (hasAny(['house price', 'house prediction', 'real estate', 'property'])) {
        return "🏠 **House Price Prediction Model**\n\nBuilt with Python and Jupyter Notebooks, this ML project focuses on real estate market analysis. It cleans raw datasets, performs feature engineering, and trains regression models (Linear Regression, Random Forest) to accurately predict property prices.\n\n**Tech Used**: Python, Pandas, Scikit-Learn, Jupyter, Matplotlib\n\n[View Repo →](https://github.com/AshwinSanthanakrishnan/House-Price-Prediction)";
      }
      if (hasAny(['hiring', 'assistant', 'recruit', 'resume', 'candidate'])) {
        return "👔 **Intelligent Hiring Assistant**\n\nA TypeScript-based application that automates the resume screening process using NLP. It parses candidate resumes, extracts key technical skills and experience tags, scores candidates against job descriptions, and surfaces the best-fit profiles.\n\n**Tech Used**: TypeScript, Node.js, NLP libraries, Applied ML\n\n[View Repo →](https://github.com/AshwinSanthanakrishnan/intelligent-hiring-assistant)";
      }
      if (hasAny(['nlp', 'natural language', 'text', 'classification', 'sentiment'])) {
        return "🧠 **Mini-Project NLP Systems**\n\nA suite of NLP mini-projects built in TypeScript. Includes text classification pipelines, sentiment analysis models, and sentence tokenization experiments using pre-trained language models deployed in Node environments.\n\n**Tech Used**: TypeScript, NLP Models, Machine Learning, Model Deployment\n\n[View Repo →](https://github.com/AshwinSanthanakrishnan/Mini-Project-NLP)";
      }
      if (hasAny(['report', 'bi', 'dashboard', 'power bi', 'tableau', 'visualization'])) {
        return "📊 **Reports & BI Dashboards**\n\nA curated collection of business intelligence reports and interactive Power BI dashboards built for real client and government scenarios. Includes paginated reports, KPI tracking dashboards, and SQL-backed data models.\n\n**Tech Used**: Power BI, DAX, SQL Server, Paginated Report Builder\n\n[View Repo →](https://github.com/AshwinSanthanakrishnan/Reports)";
      }
      return "Ashwin's featured projects include:<br><ul><li>🏠 <strong>House Price Prediction</strong> — Python ML regression model for property pricing. <a href='https://github.com/AshwinSanthanakrishnan/House-Price-Prediction' target='_blank'>View →</a></li><li>👔 <strong>Intelligent Hiring Assistant</strong> — TypeScript NLP resume screening system. <a href='https://github.com/AshwinSanthanakrishnan/intelligent-hiring-assistant' target='_blank'>View →</a></li><li>🧠 <strong>Mini-Project NLP Systems</strong> — Text classification & sentiment analysis. <a href='https://github.com/AshwinSanthanakrishnan/Mini-Project-NLP' target='_blank'>View →</a></li><li>📊 <strong>Reports & BI Dashboards</strong> — Power BI dashboards for government & enterprise. <a href='https://github.com/AshwinSanthanakrishnan/Reports' target='_blank'>View →</a></li></ul>Ask me about any specific project for more details!";
    }

    // === SKILLS ===
    if (hasAny(['skill', 'skills', 'know', 'technologies', 'tech stack', 'programming', 'languages', 'tools', 'expertise'])) {
      if (hasAny(['python', 'pandas', 'scikit', 'numpy'])) {
        return "🐍 Ashwin is highly proficient in **Python** for data analysis, machine learning, and automation. He uses libraries like Pandas, NumPy, Scikit-Learn, and Matplotlib regularly in his projects and professional work.";
      }
      if (hasAny(['sql', 'database', 'dataverse', 'sql server', 'mysql'])) {
        return "🗄️ Ashwin has strong SQL skills across **SQL Server, MySQL, and SQLite**. He designs relational data models, writes complex joins and aggregations in DAX, and manages Microsoft Dataverse databases for Power Platform applications.";
      }
      if (hasAny(['power bi', 'power apps', 'power automate', 'power platform', 'microsoft'])) {
        return "📊 Ashwin is a **Microsoft Power Platform** specialist. He builds canvas and model-driven Power Apps, designs automated workflows with Power Automate, creates interactive Power BI dashboards, and manages Dataverse data architecture. He holds both Power Platform certifications.";
      }
      if (hasAny(['ai tool', 'cursor', 'claude', 'n8n', 'vapi', 'manus', 'antigravity', 'codex'])) {
        return "🤖 Ashwin actively uses cutting-edge AI tools in his workflow:<br><ul><li><strong>Cursor AI</strong> — Vibe coding & prompt engineering</li><li><strong>Claude AI</strong> — Complex reasoning and writing</li><li><strong>OpenAI Codex</strong> — Code generation</li><li><strong>Google Antigravity</strong> — Agentic coding</li><li><strong>Vapi AI</strong> — Voice AI applications</li><li><strong>n8n</strong> — Workflow automation</li><li><strong>Manus</strong> — Autonomous AI agents</li><li><strong>Google AI Studio</strong> — Gemini experiments</li></ul>";
      }
      if (hasAny(['tableau', 'looker', 'google looker', 'visualization'])) {
        return "📈 Ashwin is skilled in **data visualization tools** including Microsoft Power BI, Tableau, and Google Looker Studio. He designs executive dashboards that combine clean layouts with actionable KPI tracking.";
      }
      if (hasAny(['r language', 'rstudio', 'ggplot'])) {
        return "📉 Ashwin is proficient in **R** for statistical computing and data analysis, often using it for exploratory data analysis (EDA), visualization with ggplot2, and academic research projects.";
      }
      return "Ashwin's full technical skill set:<br><ul><li>🐍 <strong>Languages</strong>: Python, SQL, DAX, JavaScript, R</li><li>📊 <strong>BI Tools</strong>: Power BI, Tableau, Looker Studio, Paginated Report Builder</li><li>⚙️ <strong>Platforms</strong>: Power Apps, Power Automate, Dataverse, Azure DevOps, SharePoint, Oracle Apex</li><li>🗄️ <strong>Databases</strong>: SQL Server, MySQL, SQLite, AWS Console</li><li>🤖 <strong>AI Tools</strong>: Cursor AI, Claude AI, OpenAI Codex, Google Antigravity, Vapi AI, Manus, n8n, Google AI Studio</li></ul>Ask me about any specific tool or technology!";
    }

    // === EXPERIENCE / WORK ===
    if (hasAny(['experience', 'work history', 'where have you worked', 'job', 'company', 'employer', 'career', 'dementia', 'ark', 'nih', 'government', 'role'])) {
      if (hasAny(['dementia', 'ecommerce', 'e-commerce', 'ads', 'roas', 'conversion'])) {
        return "📈 **AI Data Analyst @ Dementia Aide** (Oct 2025 – May 2026)\n\n• Extracted and analyzed large-scale e-commerce datasets with Python, boosting conversion metrics by **70%**\n• Built automated categorization scripts using Cursor AI and prompt engineering, replacing **15+ hours** of manual spreadsheet work per week\n• Created Power BI dashboards to visualize ad performance\n• Conducted historical analysis on **20+ campaigns** to optimize ROAS above 4.0\n• Managed Google Ads and Meta Ads campaigns with data-driven optimization";
      }
      if (hasAny(['ark', 'infotech', 'nih', 'power apps', 'government', 'etl', 'playwright'])) {
        return "💼 **Data Engineer / Power Apps Developer @ Ark Infotech LLC** (May 2023 – Aug 2024)\n\n• Developed **6 data applications** for NIH government projects using Power Apps and Power BI\n• Designed relational data models in **Microsoft Dataverse**, improving data integrity and access\n• Configured **Playwright browser automation** test scripts, reducing manual QA time\n• Built Python-based ETL pipelines and Paginated Reports for complex dataset migration\n• Collaborated on SharePoint integration and Azure DevOps deployment pipelines";
      }
      return "Ashwin has **2 years of professional experience** across data engineering and AI analytics roles:<br><br>📈 <strong>AI Data Analyst</strong> @ Dementia Aide (Oct 2025 – May 2026)<br>→ Python data analysis, Power BI dashboards, e-commerce optimization, ROAS improvement<br><br>💼 <strong>Data Engineer / Power Apps Developer</strong> @ Ark Infotech LLC (May 2023 – Aug 2024)<br>→ NIH government apps, Power Platform development, ETL pipelines, Playwright automation<br><br>Ask me about either role for more details!";
    }

    // === EDUCATION ===
    if (hasAny(['education', 'degree', 'university', 'college', 'school', 'study', 'studied', 'graduate', 'ms ', 'masters', 'bachelor', 'bs ', 'catholic', 'suny', 'gpa', 'major'])) {
      return "🎓 Ashwin's academic background:<br><br><strong>Master of Science in Data Analytics</strong><br>Catholic University of America, Washington D.C. | May 2026<br>Focused on machine learning, statistical modeling, data visualization, and big data systems.<br><br><strong>Bachelor of Science in Computer Engineering</strong><br>State University of New York (SUNY) | May 2023<br>Foundation in algorithms, data structures, systems programming, and software engineering.";
    }

    // === CERTIFICATIONS ===
    if (hasAny(['certification', 'certifications', 'cert', 'certified', 'microsoft cert', 'pl-100', 'pl-400', 'badge'])) {
      return "🏆 Ashwin holds **2 Microsoft Power Platform certifications**:<br><br>✅ <strong>Microsoft Certified: Power Platform Developer Associate (PL-400)</strong><br>Validates skills in building Power Apps, Power Automate flows, securing Dataverse solutions, and creating embedded Power BI components.<br><br>✅ <strong>Microsoft Certified: Power Platform Fundamentals (PL-100)</strong><br>Core knowledge of Power Platform capabilities, connector ecosystem, security model, and business value integration.";
    }

    // === CONTACT ===
    if (hasAny(['contact', 'email', 'phone', 'hire', 'reach', 'get in touch', 'connect', 'available', 'work together', 'collaborate'])) {
      return "📬 You can reach Ashwin directly:<br><br>📧 <strong>Email</strong>: <a href='mailto:ashwin638525@gmail.com'>ashwin638525@gmail.com</a><br>📞 <strong>Phone</strong>: (301) 466 0040<br>🐙 <strong>GitHub</strong>: <a href='https://github.com/AshwinSanthanakrishnan' target='_blank'>github.com/AshwinSanthanakrishnan</a><br><br>Or use the <strong>Contact Form</strong> at the bottom of this page to drop him a message directly!";
    }

    // === PERSONALITY / FUN ===
    if (hasAny(['hobby', 'hobbies', 'fun', 'interest', 'outside work', 'free time', 'personality', 'what do you like'])) {
      return "😄 Beyond data and code, Ashwin is passionate about exploring cutting-edge AI tools and building automated workflows. He enjoys staying up to date with the latest developments in the AI/ML space, experimenting with agent-based tools like n8n and Vapi AI, and applying technology creatively to solve real-world problems!";
    }

    // === ASPIRATIONS / GOALS ===
    if (hasAny(['goal', 'aspiration', 'looking for', 'open to', 'available', 'opportunities', 'future', 'next role'])) {
      return "🚀 Ashwin is actively seeking roles in **data analytics, AI engineering, or Power Platform development**. He's especially interested in positions where he can combine his Power BI/Power Apps expertise with modern AI tools like LLM automation and agent workflows. Feel free to reach out at ashwin638525@gmail.com!";
    }

    // === LOCATION ===
    if (hasAny(['location', 'where', 'based', 'city', 'state', 'country', 'remote', 'relocation'])) {
      return "📍 Ashwin is currently based in the **Washington D.C. metropolitan area**. He is open to both remote and hybrid opportunities across the United States.";
    }

    // === CATCH-ALL OFF-TOPIC FALLBACK ===
    // If the message doesn't match any known Ashwin topic, politely redirect
    const ashwinKeywords = ['ashwin', 'project', 'skill', 'experience', 'education', 'contact', 'cert', 'work', 'power', 'data', 'python', 'sql', 'hire', 'about'];
    const looksAboutAshwin = ashwinKeywords.some(k => has(k));

    if (!looksAboutAshwin) {
      return "🤖 I'm specifically trained to answer questions about **Ashwin Santhanakrishnan** only. I can't help with other topics, but I'd love to tell you about his skills, projects, experience, or how to contact him! Try one of the quick suggestions below.";
    }

    return "Hmm, I'm not sure about that specific detail! 🤔 Here's what I can help you with:<br><ul><li>📁 <strong>Projects</strong> — House Price Prediction, NLP Hiring Assistant, BI Reports</li><li>🛠️ <strong>Skills</strong> — Python, Power BI, Power Apps, AI Tools, SQL</li><li>💼 <strong>Experience</strong> — Dementia Aide, Ark Infotech / NIH</li><li>🎓 <strong>Education</strong> — MS Data Analytics, BS Computer Engineering</li><li>🏆 <strong>Certifications</strong> — Microsoft Power Platform (x2)</li><li>📬 <strong>Contact</strong> — Email, Phone, GitHub</li></ul>";
  };

  const handleChatSubmit = (queryText: string) => {
    if (!queryText.trim()) return;

    // Append user query
    setChatMessages(prev => [...prev, { text: queryText, sender: 'user' }]);
    setChatInput('');
    setIsTyping(true);

    setTimeout(() => {
      const response = getBotResponse(queryText);
      setIsTyping(false);
      setChatMessages(prev => [...prev, { text: response, sender: 'bot' }]);
    }, 1000);
  };

  // Utility to parse markdown links in bot messages
  const parseBotLinks = (text: string) => {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      // Append text before match
      if (match.index > lastIndex) {
        parts.push(<span key={lastIndex} dangerouslySetInnerHTML={{ __html: text.substring(lastIndex, match.index) }} />);
      }
      // Append link
      parts.push(
        <a key={match.index} href={match[2]} target="_blank" rel="noopener noreferrer">
          {match[1]}
        </a>
      );
      lastIndex = linkRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(<span key={lastIndex} dangerouslySetInnerHTML={{ __html: text.substring(lastIndex) }} />);
    }

    return parts.length > 0 ? parts : <span dangerouslySetInnerHTML={{ __html: text }} />;
  };

  return (
    <>
      {/* Screen Loader Splash */}
      <div className={`screen-loader ${!showLoader ? 'fade-out' : ''}`}>
        <div className="loader-content">
          <div className="loader-logo">AS.</div>
          <div className="loader-bar-container">
            <div className="loader-bar"></div>
          </div>
          <div className="loader-text">Initializing Ashwin's AI Twin...</div>
        </div>
      </div>

      {/* Background Ambient Glows */}
      <div className="ambient-glows">
        <div className="glow-blob glow-blob-1"></div>
        <div className="glow-blob glow-blob-2"></div>
        <div className="glow-blob glow-blob-3"></div>
      </div>

      {/* Header */}
      <header className={scrolled ? 'scroll-nav' : ''}>
        <div className="nav-container">
          <a href="#hero" className="logo" onClick={() => setMobileMenuOpen(false)}>AS.</a>
          <button 
            className={`menu-btn ${mobileMenuOpen ? 'open' : ''}`} 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          <nav>
            <ul id="nav-menu" className={mobileMenuOpen ? 'open' : ''}>
              <li><a href="#hero" className={`nav-link ${activeSection === 'hero' ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>Home</a></li>
              <li><a href="#about" className={`nav-link ${activeSection === 'about' ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>About</a></li>
              <li><a href="#skills" className={`nav-link ${activeSection === 'skills' ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>Skills</a></li>
              <li><a href="#experience" className={`nav-link ${activeSection === 'experience' ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>Experience</a></li>
              <li><a href="#projects" className={`nav-link ${activeSection === 'projects' ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>Projects</a></li>
              <li><a href="#education" className={`nav-link ${activeSection === 'education' ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>Education</a></li>
              <li><a href="#certifications" className={`nav-link ${activeSection === 'certifications' ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>Certifications</a></li>
              <li><a href="#contact" className={`nav-link ${activeSection === 'contact' ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>Contact</a></li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero">
        <div className="hero-content centered">
          <span className="hero-subtitle">Welcome to my space</span>
          <h1 className="hero-title">
            Hi, I'm <span className="gradient-text">Ashwin Santhanakrishnan</span>
            <span className="typewriter">{typedText}</span>
          </h1>
          <p className="hero-desc">
            Data Professional & AI Analyst. Ask my AI assistant anything about my skills, projects, or experience!
          </p>

          <div
            className={[
              'hero-chat-centered-container',
              chatState === 'maximized' ? 'maximized' : '',
              chatState === 'floating' ? 'floating-overlay' : '',
              chatState === 'minimized' ? 'd-none' : '',
            ].filter(Boolean).join(' ')}
          >
            <div
              className={[
                'chatbot-panel-inline',
                'glass-panel',
                chatState === 'maximized' ? 'maximized' : '',
                chatMessages.length > 2 ? 'expanded' : '',
                isTyping ? 'thinking' : '',
              ].filter(Boolean).join(' ')}
            >
              <div className="chat-header">
                <div className="chat-title-info">
                  <div className="chat-avatar">
                    <i className="fa-solid fa-robot"></i>
                  </div>
                  <div>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                      Ashwin AI Assistant
                      <span className="chat-title-sub">✨ Best expanded</span>
                    </h4>
                    <div className="chat-status">
                      {isTyping ? 'Thinking...' : 'Online & Grounded'}
                    </div>
                  </div>
                </div>
                <div className="chat-window-controls">
                  {chatState === 'floating' ? (
                    <button
                      type="button"
                      className="window-control-btn"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setChatState('minimized');
                      }}
                      title="Minimize floating chat"
                      aria-label="Minimize chat"
                    >
                      <i className="fa-solid fa-minus"></i>
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="window-control-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setChatState(chatState === 'maximized' ? 'normal' : 'maximized');
                        }}
                        title={chatState === 'maximized' ? "Restore window size" : "Maximize window size"}
                        aria-label="Toggle size"
                      >
                        <i className={`fa-solid ${chatState === 'maximized' ? 'fa-compress' : 'fa-expand'}`}></i>
                      </button>
                      <button
                        type="button"
                        className="window-control-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setChatState('minimized');
                        }}
                        title="Minimize to floating widget"
                        aria-label="Minimize"
                      >
                        <i className="fa-solid fa-minus"></i>
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              <div className="chat-messages" ref={chatMessagesContainerRef}>
                {chatMessages.map((msg, index) => {
                  if (msg.text === '__WELCOME_CARD__') {
                    return (
                      <div key={index} className="welcome-card-wrapper" style={{ alignSelf: 'center', width: '100%', maxWidth: '100%', margin: '0 auto', textAlign: 'center' }}>
                        <div className="welcome-card-header" style={{ justifyContent: 'center' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--accent-rose)', flexShrink: 0 }}>
                            <img src="assets/ashwin.jpg" alt="Ashwin Portrait" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                          <div>
                            <h3>👋 Hey there! I'm Ashwin</h3>
                          </div>
                        </div>
                        <div className="welcome-card-desc">
                          Data Professional & Power Apps Developer specializing in automated workflows, business intelligence solutions, and data engineering.
                        </div>
                        <div className="welcome-card-subtitle">Here's what you can do:</div>
                        <div className="welcome-options-grid">
                          <button
                            type="button"
                            className="welcome-option-card"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleChatSubmit("Who is Ashwin?");
                            }}
                          >
                            <span className="welcome-option-icon"><i className="fa-solid fa-robot"></i></span>
                            <span className="welcome-option-title">Ask me anything</span>
                            <span className="welcome-option-desc">About my work, process, or experience</span>
                          </button>

                          <button
                            type="button"
                            className="welcome-option-card"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                          >
                            <span className="welcome-option-icon"><i className="fa-solid fa-compass"></i></span>
                            <span className="welcome-option-title">Browse portfolio</span>
                            <span className="welcome-option-desc">Scroll down to explore the traditional way</span>
                          </button>

                          <button
                            type="button"
                            className="welcome-option-card"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                          >
                            <span className="welcome-option-icon"><i className="fa-solid fa-paper-plane"></i></span>
                            <span className="welcome-option-title">Get in touch</span>
                            <span className="welcome-option-desc">Reach out to discuss opportunities</span>
                          </button>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={index} className={`chat-msg chat-msg-${msg.sender}`}>
                      {msg.sender === 'bot' ? parseBotLinks(msg.text) : msg.text}
                    </div>
                  );
                })}
                {isTyping && (
                  <div className="chat-thinking-bubble" id="typing-indicator">
                    <span className="think-dots">
                      <span className="think-dot"></span>
                      <span className="think-dot"></span>
                      <span className="think-dot"></span>
                    </span>
                    <span>Ashwin AI is thinking…</span>
                  </div>
                )}
                <div ref={chatMessagesEndRef} />
              </div>
              
              <div className="chat-suggestions">
                {(['About Me', 'Projects', 'Skills', 'Experience', 'Contact'] as const).map((label) => {
                  const queries: Record<string, string> = {
                    'About Me': 'Who is Ashwin?',
                    'Projects': 'What are your projects?',
                    'Skills': 'What are your skills?',
                    'Experience': 'Where have you worked?',
                    'Contact': 'How to contact you?',
                  };
                  return (
                    <button
                      key={label}
                      type="button"
                      className="suggestion-pill"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleChatSubmit(queries[label]); }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              
              <form 
                className="chat-input-area" 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (chatInput.trim()) {
                    handleChatSubmit(chatInput);
                    setChatInput('');
                  }
                }}
              >
                <input 
                  type="text" 
                  placeholder="Ask me about Ashwin's skills, experience, projects..." 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  autoComplete="off" 
                  required 
                />
                <button type="submit" className="chat-send-btn" aria-label="Send message">
                  <i className="fa-solid fa-paper-plane"></i>
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="reveal">
        <div className="about-img-container">
          <div className="about-img-wrapper glass-panel">
            <img src="/assets/ashwin.jpg" alt="Ashwin Santhanakrishnan" className="about-img" />
          </div>
        </div>
        <div className="about-details">
          <h2>About Me</h2>
          <p>
            I am a dedicated Data Professional and Power Platform Developer with a passion for designing scalable applications and transforming complex datasets into actionable insights. With a Master of Science in Data Analytics, I bridge the gap between technical execution and business intelligence.
          </p>
          <p>
            Whether it is developing robust data applications for government projects, configuring browser automation systems, or optimizing multi-channel e-commerce search algorithms using Python, I thrive on finding clean, structured solutions to complex data problems.
          </p>
          <div className="about-stats">
            <div className="stat-card glass-panel">
              <span className="stat-number">6+</span>
              <span className="stat-label">Data Apps Built</span>
            </div>
            <div className="stat-card glass-panel">
              <span className="stat-number">70%</span>
              <span className="stat-label">ROAS & Gain</span>
            </div>
            <div className="stat-card glass-panel">
              <span className="stat-number">26k+</span>
              <span className="stat-label">Keywords Processed</span>
            </div>
            <div className="stat-card glass-panel">
              <span className="stat-number">2</span>
              <span className="stat-label">Microsoft Certs</span>
            </div>
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section id="skills" className="reveal">
        <h2>Technical Skills</h2>
        <div className="skills-container">
          {/* Languages */}
          <div className="skills-category glass-panel">
            <h3><i className="fa-solid fa-code" style={{ color: 'var(--accent-cyan)' }}></i> Languages</h3>
            <div className="skills-list">
              <span className="skill-tag">Python</span>
              <span className="skill-tag">DAX</span>
              <span className="skill-tag">SQL</span>
              <span className="skill-tag">JavaScript</span>
              <span className="skill-tag">R</span>
            </div>
          </div>
          
          {/* BI */}
          <div className="skills-category glass-panel">
            <h3><i className="fa-solid fa-chart-pie" style={{ color: 'var(--accent-purple)' }}></i> Business Intelligence</h3>
            <div className="skills-list">
              <span className="skill-tag">Microsoft Power BI</span>
              <span className="skill-tag">Tableau</span>
              <span className="skill-tag">Google Looker Studio</span>
              <span className="skill-tag">Paginated Report Builder</span>
            </div>
          </div>

          {/* Platforms */}
          <div className="skills-category glass-panel">
            <h3><i className="fa-solid fa-cubes" style={{ color: 'var(--accent-cyan)' }}></i> Platforms & Tools</h3>
            <div className="skills-list">
              <span className="skill-tag">Microsoft Power Apps</span>
              <span className="skill-tag">Power Automate</span>
              <span className="skill-tag">Microsoft Dataverse</span>
              <span className="skill-tag">Azure DevOps</span>
              <span className="skill-tag">SharePoint</span>
              <span className="skill-tag">Cursor AI</span>
              <span className="skill-tag">Oracle Apex</span>
              <span className="skill-tag">Google Ads</span>
              <span className="skill-tag">Meta Ads</span>
            </div>
          </div>

          {/* Databases */}
          <div className="skills-category glass-panel">
            <h3><i className="fa-solid fa-database" style={{ color: 'var(--accent-purple)' }}></i> Databases & Cloud</h3>
            <div className="skills-list">
              <span className="skill-tag">SQL Server</span>
              <span className="skill-tag">MySQL</span>
              <span className="skill-tag">SQLite</span>
              <span className="skill-tag">AWS Console</span>
              <span className="skill-tag">Windows & Mac</span>
              <span className="skill-tag">Linux</span>
            </div>
          </div>
        </div>
      </section>

      {/* Experience Section */}
      <section id="experience" className="reveal">
        <h2>Professional Experience</h2>
        <div className="timeline">
          
          <div className="timeline-item">
            <div className="timeline-badge"></div>
            <div className="timeline-content glass-panel">
              <span className="timeline-date">October 2025 - May 2026</span>
              <h3>AI Data Analyst</h3>
              <span className="timeline-company">Dementia Aide | CA</span>
              <ul>
                <li>Extracted and analyzed large-scale e-commerce datasets using Python to identify statistical trends, optimizing conversion and key metrics by 70%.</li>
                <li>Built automated workflow scripts using Vibe coding and prompt engineering in Cursor AI, replacing 15+ hours of manual spreadsheet work.</li>
                <li>Created Power BI dashboards to visualize ad performance, speeding up internal decision-making.</li>
                <li>Conducted historical analysis on 20+ campaigns to optimize Return on Ad Spend (ROAS) to over 4.0.</li>
              </ul>
            </div>
          </div>

          <div className="timeline-item">
            <div className="timeline-badge"></div>
            <div className="timeline-content glass-panel">
              <span className="timeline-date">May 2023 - August 2024</span>
              <h3>Data Engineer / Power Apps Developer</h3>
              <span className="timeline-company">Ark Infotech LLC | MD</span>
              <ul>
                <li>Developed 6 data applications for NIH government projects, integrating Power Apps and Power BI.</li>
                <li>Designed and implemented relational data models in Microsoft Dataverse, improving data integrity.</li>
                <li>Configured Playwright automation test scripts, reducing manual testing time.</li>
                <li>Developed Power BI dashboards, Paginated Reports, and Python-based ETL pipelines to prepare complex datasets for migration.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="reveal">
        <h2>Featured Projects</h2>
        <div className="projects-grid">
          
          <div className="project-card glass-panel">
            <div className="project-img-wrapper">
              <img src="/assets/power-apps.jpg" alt="Intelligent Hiring Assistant" className="project-img" />
              <div className="project-overlay"></div>
            </div>
            <div className="project-content">
              <h3>Intelligent Hiring Assistant</h3>
              <p>
                An applied Natural Language Processing (NLP) system designed to automate candidate resume screening, key skill extraction, and profile analysis for streamlined talent acquisition.
              </p>
              <div className="project-tags">
                <span className="project-tag">TypeScript</span>
                <span className="project-tag">NLP</span>
                <span className="project-tag">Node.js</span>
                <span className="project-tag">Applied ML</span>
              </div>
              <div className="project-links">
                <a href="https://github.com/AshwinSanthanakrishnan/intelligent-hiring-assistant" target="_blank" rel="noopener noreferrer" className="project-link">
                  <i className="fa-brands fa-github"></i> Repository
                </a>
              </div>
            </div>
          </div>

          <div className="project-card glass-panel">
            <div className="project-img-wrapper">
              <img src="/assets/house-prediction.jpg" alt="House Price Prediction" className="project-img" />
              <div className="project-overlay"></div>
            </div>
            <div className="project-content">
              <h3>House Price Prediction Model</h3>
              <p>
                A machine learning project built with Python and Jupyter Notebooks, incorporating real estate market analysis, regression modeling, and feature engineering to predict property pricing accurately.
              </p>
              <div className="project-tags">
                <span className="project-tag">Python</span>
                <span className="project-tag">Jupyter</span>
                <span className="project-tag">Pandas</span>
                <span className="project-tag">Scikit-Learn</span>
              </div>
              <div className="project-links">
                <a href="https://github.com/AshwinSanthanakrishnan/House-Price-Prediction" target="_blank" rel="noopener noreferrer" className="project-link">
                  <i className="fa-brands fa-github"></i> Repository
                </a>
              </div>
            </div>
          </div>

          <div className="project-card glass-panel">
            <div className="project-img-wrapper">
              <img src="/assets/etl-pipeline.jpg" alt="Mini-Project NLP Systems" className="project-img" />
              <div className="project-overlay"></div>
            </div>
            <div className="project-content">
              <h3>Mini-Project NLP Systems</h3>
              <p>
                An intelligent text understanding system utilizing pre-trained language models for sentiment analysis, semantic sorting, and sentence tokenization within node environments.
              </p>
              <div className="project-tags">
                <span className="project-tag">TypeScript</span>
                <span className="project-tag">NLP</span>
                <span className="project-tag">Machine Learning</span>
                <span className="project-tag">Model Deployment</span>
              </div>
              <div className="project-links">
                <a href="https://github.com/AshwinSanthanakrishnan/Mini-Project-NLP" target="_blank" rel="noopener noreferrer" className="project-link">
                  <i className="fa-brands fa-github"></i> Repository
                </a>
              </div>
            </div>
          </div>

          <div className="project-card glass-panel">
            <div className="project-img-wrapper">
              <img src="/assets/power-bi.jpg" alt="Reports & BI Dashboards" className="project-img" />
              <div className="project-overlay"></div>
            </div>
            <div className="project-content">
              <h3>Reports & BI Dashboards</h3>
              <p>
                A curated portfolio of customized business intelligence reports, interactive Power BI visualizations, and automated data architectures designed for executive decision-making.
              </p>
              <div className="project-tags">
                <span className="project-tag">Power BI</span>
                <span className="project-tag">Reporting</span>
                <span className="project-tag">Data Modeling</span>
                <span className="project-tag">SQL</span>
              </div>
              <div className="project-links">
                <a href="https://github.com/AshwinSanthanakrishnan/Reports" target="_blank" rel="noopener noreferrer" className="project-link">
                  <i className="fa-brands fa-github"></i> Repository
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Education Section */}
      <section id="education" className="reveal">
        <h2>Education</h2>
        <div className="certs-grid">
          <div className="cert-card glass-panel">
            <div className="cert-icon">
              <i className="fa-solid fa-graduation-cap"></i>
            </div>
            <div className="cert-details">
              <h3>Master of Science in Data Analytics</h3>
              <p>Catholic University of America | May 2026</p>
            </div>
          </div>

          <div className="cert-card glass-panel">
            <div className="cert-icon">
              <i className="fa-solid fa-graduation-cap"></i>
            </div>
            <div className="cert-details">
              <h3>Bachelor of Science in Computer Engineering</h3>
              <p>State University of New York (SUNY) | May 2023</p>
            </div>
          </div>
        </div>
      </section>

      {/* Certifications Section */}
      <section id="certifications" className="reveal">
        <h2>Certifications</h2>
        <div className="certs-grid">
          <div className="cert-card glass-panel">
            <div className="cert-icon">
              <i className="fa-solid fa-certificate"></i>
            </div>
            <div className="cert-details">
              <h3>Microsoft Certified: Power Platform Developer Associate</h3>
              <p>Validated skills in building Power Apps, Power Automate flows, securing Dataverse solutions, and creating Power BI components.</p>
            </div>
          </div>

          <div className="cert-card glass-panel">
            <div className="cert-icon">
              <i className="fa-solid fa-certificate"></i>
            </div>
            <div className="cert-details">
              <h3>Microsoft Certified: Power Platform Fundamentals</h3>
              <p>Core knowledge of Power Platform capabilities, security model, business value, and database integration workflows.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="reveal">
        <h2>Get In Touch</h2>
        <div className="contact-container">
          <div className="contact-info">
            <h3>Let's start a conversation</h3>
            <p>Whether you're looking to consult on data pipelines, looking for a Power Platform application developer, or want to collaborate on AI-driven analytics, feel free to drop a message!</p>
            <div className="contact-methods">
              <a href="mailto:ashwin638525@gmail.com" className="contact-method">
                <i className="fa-solid fa-envelope"></i>
                <span>ashwin638525@gmail.com</span>
              </a>
              <a href="tel:+13014660040" className="contact-method">
                <i className="fa-solid fa-phone"></i>
                <span>(301) 466 0040</span>
              </a>
              <a href="https://github.com/AshwinSanthanakrishnan" target="_blank" rel="noopener noreferrer" className="contact-method">
                <i className="fa-brands fa-github"></i>
                <span>github.com/AshwinSanthanakrishnan</span>
              </a>
            </div>
          </div>
          
          <form className="contact-form glass-panel" onSubmit={handleContactSubmit}>
            {formSubmitted ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(0, 242, 254, 0.1)', border: '2px solid var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: 'var(--accent-cyan)' }}>
                  <i className="fa-solid fa-check"></i>
                </div>
                <h3 style={{ fontSize: '1.8rem', margin: 0, background: 'linear-gradient(135deg, var(--accent-rose), var(--accent-violet))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Message Sent!</h3>
                <p style={{ color: 'var(--text-muted)', maxWidth: '320px', fontSize: '0.95rem', lineHeight: '1.6' }}>Thank you, <strong>{formName}</strong>. Your message was successfully dispatched. I'll get back to you at <strong>{formEmail}</strong> within 24 hours.</p>
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label htmlFor="form-name">Name</label>
                  <input type="text" id="form-name" placeholder="John Doe" value={formName} onChange={(e) => setFormName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label htmlFor="form-email">Email Address</label>
                  <input type="email" id="form-email" placeholder="john@example.com" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label htmlFor="form-subject">Subject</label>
                  <input type="text" id="form-subject" placeholder="Project Inquiry" value={formSubject} onChange={(e) => setFormSubject(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label htmlFor="form-message">Message</label>
                  <textarea id="form-message" rows={5} placeholder="Let's build something awesome..." value={formMessage} onChange={(e) => setFormMessage(e.target.value)} required></textarea>
                </div>
                <button type="submit" className="btn-primary" disabled={formSending}>
                  {formSending ? (
                    <>Sending... <i className="fa-solid fa-spinner fa-spin"></i></>
                  ) : (
                    <>Send Message <i className="fa-solid fa-paper-plane"></i></>
                  )}
                </button>
              </>
            )}
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <p>&copy; 2026 Ashwin Santhanakrishnan. All Rights Reserved. Built with custom CSS & Next.js + React.</p>
      </footer>

      {/* Floating Minimized Trigger */}
      {chatState === 'minimized' && showStickyBar && (
        <button 
          type="button"
          className="chatbot-minimized-trigger"
          onClick={() => setChatState('floating')}
          aria-label="Open AI Assistant"
        >
          <i className="fa-solid fa-comments"></i>
          <span className="minimized-badge"></span>
        </button>
      )}

      {/* Sticky Chat Typing Bar */}
      {showStickyBar && chatState !== 'floating' && (
        <div className="sticky-chat-bar-container">
          <form 
            className="sticky-chat-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (chatInput.trim()) {
                handleChatSubmit(chatInput);
                setChatState('floating');
              }
            }}
          >
            <input
              type="text"
              placeholder="Ask Ashwin's AI anything..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={isTyping}
            />
            <button type="submit" disabled={isTyping || !chatInput.trim()}>
              <i className="fa-solid fa-paper-plane"></i>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
