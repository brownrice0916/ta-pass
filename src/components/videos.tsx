'use client'

import React, { useEffect, useState } from 'react';

interface VideoInfo {
    id: string;
    title: string;
    thumbnail: string;
    channelTitle: string;
    publishedAt: string;
    url: string; // URL 추가
}

export default function KoreaTrends() {
    const [videos, setVideos] = useState<VideoInfo[]>([]);
    const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

    const videoUrls = [
        "https://www.youtube.com/watch?v=lIQwNYHaHJ0&feature=youtu.be",
        "https://www.youtube.com/watch?v=fNlqcfBTEG0&feature=youtu.be",
        "https://www.youtube.com/watch?v=wxCb3QrO4Dg&feature=youtu.be",
        "https://www.youtube.com/watch?v=It5feL4xzl4&feature=youtu.be",
        "https://www.youtube.com/watch?v=ii4P-BNDeEI&feature=youtu.be",
        "https://www.youtube.com/watch?v=-WNgQK4XSuA&feature=youtu.be",
        "https://www.youtube.com/watch?v=EUVnwyjF_gs"
    ];

    useEffect(() => {
        async function fetchVideoInfo() {
            const API_KEY = 'AIzaSyDKB4ZWv2cw5FEHbMSGDf1XAbRnK-in_gA';

            try {
                const videoIds = videoUrls.map(url => {
                    const urlParams = new URLSearchParams(new URL(url).search);
                    return urlParams.get('v');
                });

                const response = await fetch(
                    `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoIds.join(',')}&key=${API_KEY}`
                );

                const data = await response.json();

                const videoInfo = data.items.map((item: any, index: number) => ({
                    id: item.id,
                    title: item.snippet.title,
                    thumbnail: item.snippet.thumbnails.medium.url,
                    channelTitle: item.snippet.channelTitle,
                    publishedAt: new Date(item.snippet.publishedAt).toLocaleDateString(),
                    url: videoUrls[index] // 원본 URL 저장
                }));

                setVideos(videoInfo);
            } catch (error) {
                console.error('Error fetching video info:', error);
            }
        }

        fetchVideoInfo();
    }, []);

    // 모달 닫기 핸들러
    const handleCloseModal = () => {
        setSelectedVideo(null);
    };

    return (
        <section className="p-4">
            <h2 className="text-2xl font-bold mb-6">
                Want to know more about Korea Trends?
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                {videos.map((video) => (
                    <div
                        key={video.id}
                        className="cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setSelectedVideo(video.id)}
                    >
                        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                            <img
                                src={video.thumbnail}
                                alt={video.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="mt-2">
                            <p className="text-sm font-medium line-clamp-2 leading-snug mb-1">
                                {video.title}
                            </p>
                            <p className="text-xs text-gray-600">
                                {video.channelTitle}
                            </p>
                            <p className="text-xs text-gray-600">
                                {video.publishedAt}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* YouTube Video Modal */}
            {selectedVideo && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="relative w-full max-w-4xl aspect-video">
                        <button
                            onClick={handleCloseModal}
                            className="absolute -top-10 right-0 text-white hover:text-gray-300"
                        >
                            Close
                        </button>
                        <iframe
                            src={`https://www.youtube.com/embed/${selectedVideo}`}
                            className="w-full h-full rounded-lg"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>
                </div>
            )}
        </section>
    );
}