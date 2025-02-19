import React, { useEffect, useRef, useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import io from 'socket.io-client';
import './index.css';
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaPhone } from 'react-icons/fa';

const VideoConsultation = () => {
    const { meeting_id } = useParams();
    const history = useHistory();

    // Refs
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const socketRef = useRef(null);
    const peerConnectionRef = useRef(null);

    // State
    const [localStream, setLocalStream] = useState(null);
    const [error, setError] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('Connecting to doctor...');

    useEffect(() => {
        const initializeConnection = async () => {
            try {
                // 1. Get local media stream
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });
                
                setLocalStream(stream);
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }

                // 2. Create peer connection
                const pc = new RTCPeerConnection({
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        {
                            urls: 'turn:numb.viagenie.ca',
                            username: 'webrtc@live.com',
                            credential: 'muazkh'
                        }
                    ]
                });

                // Add tracks to peer connection
                stream.getTracks().forEach(track => {
                    pc.addTrack(track, stream);
                });

                // Handle incoming stream
                pc.ontrack = (event) => {
                    console.log('Received remote track');
                    if (remoteVideoRef.current && event.streams[0]) {
                        remoteVideoRef.current.srcObject = event.streams[0];
                        setIsConnected(true);
                        setConnectionStatus('Connected');
                    }
                };

                // 3. Set up Socket.IO connection
                const socket = io('http://localhost:3009', {
                    transports: ['websocket'],
                    reconnection: true,
                    reconnectionAttempts: 5,
                    reconnectionDelay: 1000,
                    timeout: 10000
                });

                socket.on('connect', () => {
                    console.log('Patient connected to socket server');
                    socket.emit('join-room', { meeting_id, isDoctor: false });
                });

                socket.on('joined-room', (response) => {
                    if (response.success) {
                        console.log('Successfully joined room:', response.meeting_id);
                        setConnectionStatus('Connected to room, waiting for doctor...');
                    }
                });

                socket.on('user-connected', async () => {
                    console.log('Doctor connected, creating offer');
                    try {
                        const offer = await pc.createOffer();
                        await pc.setLocalDescription(offer);
                        socket.emit('offer', { offer, meeting_id });
                    } catch (err) {
                        console.error('Error creating offer:', err);
                    }
                });

                socket.on('answer', async (answer) => {
                    console.log('Received answer from doctor');
                    try {
                        await pc.setRemoteDescription(new RTCSessionDescription(answer));
                    } catch (err) {
                        console.error('Error setting remote description:', err);
                    }
                });

                socket.on('ice-candidate', async (candidate) => {
                    try {
                        if (pc.remoteDescription) {
                            await pc.addIceCandidate(new RTCIceCandidate(candidate));
                        }
                    } catch (err) {
                        console.error('Error adding ICE candidate:', err);
                    }
                });

                // ICE candidate handling
                pc.onicecandidate = (event) => {
                    if (event.candidate) {
                        socket.emit('ice-candidate', {
                            candidate: event.candidate,
                            meeting_id
                        });
                    }
                };

                pc.oniceconnectionstatechange = () => {
                    console.log('ICE Connection State:', pc.iceConnectionState);
                    if (pc.iceConnectionState === 'connected') {
                        setConnectionStatus('Connected to doctor');
                        setIsConnected(true);
                    } else if (pc.iceConnectionState === 'disconnected') {
                        setConnectionStatus('Disconnected from doctor');
                        setIsConnected(false);
                    }
                };

                // Store references
                socketRef.current = socket;
                peerConnectionRef.current = pc;

            } catch (err) {
                console.error('Failed to initialize:', err);
                setError(err.message);
            }
        };

        initializeConnection();

        // Cleanup
        return () => {
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
            }
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [meeting_id]);

    // Control functions
    const toggleMute = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsVideoOff(!isVideoOff);
        }
    };

    const handleEndCall = () => {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
        }
        if (socketRef.current) {
            socketRef.current.disconnect();
        }
        history.push('/');
    };

    if (error) {
        return (
            <div className="video-consultation-container error-state">
                <div className="error-container">
                    <h2>Connection Error</h2>
                    <p>{error}</p>
                    <button className="end-call" onClick={() => history.push('/')}>
                        Return Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="video-consultation-container">
            <div className="consultation-header">
                <div className="consultation-info">
                    <h2>Patient Consultation</h2>
                    <div className="consultation-status">
                        <div className="status-indicator"></div>
                        <span>{connectionStatus}</span>
                    </div>
                </div>
                <div className="meeting-id">
                    Meeting ID: {meeting_id}
                </div>
            </div>

            <div className="video-grid">
                <div className="main-video-container">
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="remote-video"
                    />
                </div>
                <div className="local-video-container">
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="local-video"
                    />
                </div>
            </div>

            <div className="controls">
                <button 
                    className="control-button mic-button"
                    onClick={toggleMute}
                >
                    {isMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
                </button>
                <button 
                    className="control-button camera-button"
                    onClick={toggleVideo}
                >
                    {isVideoOff ? <FaVideoSlash /> : <FaVideo />}
                </button>
                <button className="control-button end-call" onClick={handleEndCall}>
                    <FaPhone style={{ transform: 'rotate(135deg)' }} />
                </button>
            </div>
        </div>
    );
};

export default VideoConsultation;