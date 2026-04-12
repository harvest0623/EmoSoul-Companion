import React, { useEffect, useState, useRef } from 'react';
import avatarSurprised from '../../assets/images/avatar-surprised.png';
import avatarSad from '../../assets/images/avatar-sad.png';
import avatarThinking from '../../assets/images/avatar-thinking.png';
import '../../styles/Avatar.css';

const avatarImages = {
    surprised: avatarSurprised,
    sad: avatarSad,
    thinking: avatarThinking
};

const emotions = ['surprised', 'sad', 'thinking'];

// 调试：打印图片路径
console.log('Avatar images paths:', {
  surprised: avatarSurprised,
  sad: avatarSad,
  thinking: avatarThinking
});

const DigitalAvatar = ({ emotion = 'thinking', isTyping = false }) => {
    const [currentEmotion, setCurrentEmotion] = useState(emotion);
    const [prevEmotion, setPrevEmotion] = useState(emotion);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const [isClicked, setIsClicked] = useState(false);
    const particlesRef = useRef(null);
    const rippleRef = useRef(null);

    useEffect(() => {
        if (!isHovering && emotion !== currentEmotion) {
            setPrevEmotion(currentEmotion);
            setIsTransitioning(true);
            // 短暂延迟后切换，制造淡出-淡入效果
            const timer = setTimeout(() => {
                setCurrentEmotion(emotion);
                setIsTransitioning(false);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [emotion, currentEmotion, isHovering]);

    const handleMouseEnter = () => {
        setIsHovering(true);
        // 随机选择一个不同的表情
        const otherEmotions = emotions.filter(emo => emo !== currentEmotion);
        const randomEmotion = otherEmotions[Math.floor(Math.random() * otherEmotions.length)];
        
        setPrevEmotion(currentEmotion);
        setIsTransitioning(true);
        setTimeout(() => {
            setCurrentEmotion(randomEmotion);
            setIsTransitioning(false);
        }, 300);
        
        // 生成粒子效果
        createParticles();
    };

    const handleMouseLeave = () => {
        setIsHovering(false);
        setPrevEmotion(currentEmotion);
        setIsTransitioning(true);
        setTimeout(() => {
            setCurrentEmotion(emotion);
            setIsTransitioning(false);
        }, 300);
    };

    const handleClick = () => {
        setIsClicked(true);
        setTimeout(() => setIsClicked(false), 300);
        
        // 生成波纹效果
        createRipple();
    };

    const createParticles = () => {
        if (!particlesRef.current) return;
        
        // 清空现有粒子
        particlesRef.current.innerHTML = '';
        
        // 创建10个粒子
        for (let i = 0; i < 10; i++) {
            const particle = document.createElement('div');
            particle.className = 'avatar-particle';
            
            // 随机位置
            const x = Math.random() * 100;
            const y = Math.random() * 100;
            particle.style.left = `${x}%`;
            particle.style.top = `${y}%`;
            
            // 随机颜色
            const colors = ['rgba(139, 92, 246, 0.8)', 'rgba(236, 72, 153, 0.8)', 'rgba(167, 139, 250, 0.8)'];
            particle.style.background = colors[Math.floor(Math.random() * colors.length)];
            
            // 随机大小
            const size = Math.random() * 4 + 2;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            
            // 随机动画延迟
            particle.style.animationDelay = `${Math.random() * 0.5}s`;
            
            particlesRef.current.appendChild(particle);
        }
    };

    const createRipple = () => {
        if (!rippleRef.current) return;
        
        const ripple = document.createElement('div');
        ripple.className = 'avatar-ripple-effect';
        rippleRef.current.appendChild(ripple);
        
        // 动画结束后移除波纹
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, 2000);
    };

    return (
        <div 
            className={`avatar-container ${isTyping ? 'typing' : ''} ${currentEmotion} ${isClicked ? 'clicked' : ''}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
        >
            <div className="avatar-glow-ring" />
            <div className="avatar-image-wrapper">
                {emotions.map(emo => (
                    <img
                        key={emo}
                        src={avatarImages[emo]}
                        alt={`数字人${emo}表情`}
                        className={`avatar-img ${currentEmotion === emo ? 'active' : ''} ${isTransitioning && prevEmotion === emo ? 'fading-out' : ''}`}
                        draggable={false}
                    />
                ))}
            </div>
            <div className="avatar-particles" ref={particlesRef} />
            <div className="avatar-ripple" ref={rippleRef} />
        </div>
    );
};

export default DigitalAvatar;