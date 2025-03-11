let currentMedia = null;
let mediaElements = [];

// 查找页面中所有的音视频元素
function findMediaElements() {
  mediaElements = [...document.getElementsByTagName('video'), ...document.getElementsByTagName('audio')];
  return mediaElements;
}

// 获取当前正在播放的媒体元素
function getCurrentPlayingMedia() {
  // 首先尝试获取画中画模式的视频
  if (document.pictureInPictureElement) {
    return document.pictureInPictureElement;
  }

  // 然后尝试获取正在播放的媒体
  const playingMedia = mediaElements.find(media => !media.paused);
  if (playingMedia) {
    return playingMedia;
  }

  // 最后返回第一个找到的媒体元素
  return mediaElements[0];
}

// 获取网站特定的控制按钮
function getSiteSpecificControls() {
  const hostname = window.location.hostname;

  if (hostname.includes('youtube.com')) {
    return {
      next: document.querySelector('.ytp-next-button'),
      prev: document.querySelector('.ytp-prev-button')
    };
  }

  if (hostname.includes('bilibili.com')) {
    return {
      next: document.querySelector('.bilibili-player-video-btn-next'),
      prev: document.querySelector('.bilibili-player-video-btn-prev')
    };
  }

  // 通用选择器，适用于其他视频网站
  return {
    next: document.querySelector('[class*="next"]:not([style*="display: none"]), [class*="next"]:not([style*="display:none"]), [aria-label*="下一"]:not([style*="display: none"]), [title*="下一"]:not([style*="display:none"])'),
    prev: document.querySelector('[class*="prev"]:not([style*="display: none"]), [class*="prev"]:not([style*="display:none"]), [aria-label*="上一"]:not([style*="display: none"]), [title*="上一"]:not([style*="display:none"])')
  };
}

// 模拟点击事件
function simulateClick(element) {
  if (!element) return false;

  try {
    // 尝试触发原生点击事件
    element.click();
    return true;
  } catch (error) {
    try {
      // 如果原生点击失败，尝试创建模拟点击事件
      const evt = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      element.dispatchEvent(evt);
      return true;
    } catch (error) {
      console.log('点击模拟失败:', error);
      return false;
    }
  }
}

// 切换到下一个媒体元素
async function switchToNextMedia() {
  // 首先尝试使用网站特定的控制按钮
  const controls = getSiteSpecificControls();
  if (controls.next && simulateClick(controls.next)) {
    return;
  }

  // 如果没有特定控制按钮，使用默认行为
  if (!currentMedia || mediaElements.length <= 1) return;
  const currentIndex = mediaElements.indexOf(currentMedia);
  const nextIndex = (currentIndex + 1) % mediaElements.length;

  // 如果当前视频在画中画模式，先退出
  if (document.pictureInPictureElement) {
    await document.exitPictureInPicture();
  }

  currentMedia = mediaElements[nextIndex];
  await tryPlayMedia(currentMedia);
}

// 切换到上一个媒体元素
async function switchToPrevMedia() {
  // 首先尝试使用网站特定的控制按钮
  const controls = getSiteSpecificControls();
  if (controls.prev && simulateClick(controls.prev)) {
    return;
  }

  // 如果没有特定控制按钮，使用默认行为
  if (!currentMedia || mediaElements.length <= 1) return;
  const currentIndex = mediaElements.indexOf(currentMedia);
  const prevIndex = (currentIndex - 1 + mediaElements.length) % mediaElements.length;

  // 如果当前视频在画中画模式，先退出
  if (document.pictureInPictureElement) {
    await document.exitPictureInPicture();
  }

  currentMedia = mediaElements[prevIndex];
  await tryPlayMedia(currentMedia);
}

// 尝试播放媒体
async function tryPlayMedia(media) {
  try {
    if (media.paused) {
      // 使用 await 确保播放命令被执行
      await media.play();
    } else {
      media.pause();
    }
  } catch (error) {
    console.log('媒体控制出错:', error);
  }
}

// 处理来自popup的消息
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  // 立即发送响应，防止通信通道关闭
  sendResponse({ received: true });

  findMediaElements();

  if (!currentMedia) {
    currentMedia = getCurrentPlayingMedia();
  }

  if (!currentMedia && mediaElements.length > 0) {
    currentMedia = mediaElements[0];
  }

  if (!currentMedia) return;

  switch (request.action) {
    case 'togglePiP':
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (currentMedia.tagName === 'VIDEO') {
        try {
          await currentMedia.requestPictureInPicture();
        } catch (error) {
          console.log('画中画模式切换失败:', error);
        }
      }
      break;

    case 'playPause':
      await tryPlayMedia(currentMedia);
      break;

    case 'next':
      await switchToNextMedia();
      break;

    case 'prev':
      await switchToPrevMedia();
      break;

    case 'setVolume':
      currentMedia.volume = request.volume;
      break;
  }
});

// 监听页面变化，更新媒体元素列表
const observer = new MutationObserver(() => {
  findMediaElements();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// 初始化时查找媒体元素
findMediaElements();

// 监听画中画事件
document.addEventListener('enterpictureinpicture', (event) => {
  currentMedia = event.target;
});

document.addEventListener('leavepictureinpicture', () => {
  currentMedia = getCurrentPlayingMedia();
});