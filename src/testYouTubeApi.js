// Test script for YouTube API connection
const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

console.log('Testing YouTube API connection...');
console.log('API Key (first 5 chars):', API_KEY ? API_KEY.substring(0, 5) + '...' : 'Not found');

async function testYouTubeApi() {
  try {
    // Test search endpoint
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=test&key=${API_KEY}`;
    console.log('Testing search endpoint...');
    console.log('URL:', searchUrl);
    
    const searchResponse = await fetch(searchUrl);
    console.log('Response status:', searchResponse.status);
    
    if (!searchResponse.ok) {
      const errorData = await searchResponse.json();
      console.error('Search API Error:', errorData);
      return;
    }
    
    const searchData = await searchResponse.json();
    console.log('Search API test successful!');
    console.log('Found video:', searchData.items[0]?.snippet?.title);
    
    // Test video details endpoint
    if (searchData.items?.[0]?.id?.videoId) {
      const videoId = searchData.items[0].id.videoId;
      const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${API_KEY}`;
      console.log('Testing video details endpoint...');
      console.log('URL:', detailsUrl);
      
      const detailsResponse = await fetch(detailsUrl);
      console.log('Response status:', detailsResponse.status);
      
      if (!detailsResponse.ok) {
        const errorData = await detailsResponse.json();
        console.error('Video Details API Error:', errorData);
        return;
      }
      
      const detailsData = await detailsResponse.json();
      console.log('Video Details API test successful!');
      console.log('Video statistics:', detailsData.items[0]?.statistics);
    }
    
  } catch (error) {
    console.error('Error testing YouTube API:', error);
  }
}

testYouTubeApi(); 