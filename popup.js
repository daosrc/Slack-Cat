document.addEventListener('DOMContentLoaded', function() {
  const togglePiPButton = document.getElementById('togglePiP');
  const playPauseButton = document.getElementById('playPause');
  const prevButton = document.getElementById('prev');
  const nextButton = document.getElementById('next');
  const volumeControl = document.getElementById('volume');

  // 禁用按钮的函数
  function disableButtons() {
    [togglePiPButton, playPauseButton, prevButton, nextButton].forEach(button => {
      button.disabled = true;
    });
    volumeControl.disabled = true;
  }

  // 启用按钮的函数
  function enableButtons() {
    [togglePiPButton, playPauseButton, prevButton, nextButton].forEach(button => {
      button.disabled = false;
    });
    volumeControl.disabled = false;
  }

  // 发送消息到content script并处理响应
  async function sendMessage(action, data = {}) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) {
        console.log('没有找到活动标签页');
        return;
      }

      const response = await chrome.tabs.sendMessage(tab.id, {
        action,
        ...data
      });

      if (response && response.received) {
        console.log(`${action} 命令已发送`);
      }
    } catch (error) {
      console.log('发送消息失败:', error);
      disableButtons();
    }
  }

  // 画中画模式切换
  togglePiPButton.addEventListener('click', async () => {
    await sendMessage('togglePiP');
  });

  // 播放/暂停控制
  playPauseButton.addEventListener('click', async () => {
    await sendMessage('playPause');
  });

  // 上一个媒体
  prevButton.addEventListener('click', async () => {
    await sendMessage('prev');
  });

  // 下一个媒体
  nextButton.addEventListener('click', async () => {
    await sendMessage('next');
  });

  // 音量控制
  let volumeTimeout;
  volumeControl.addEventListener('input', () => {
    clearTimeout(volumeTimeout);
    volumeTimeout = setTimeout(async () => {
      await sendMessage('setVolume', {
        volume: volumeControl.value / 100
      });
    }, 100);
  });

  // 初始化时检查页面状态
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    if (!tabs[0]) {
      disableButtons();
      return;
    }

    try {
      await chrome.tabs.sendMessage(tabs[0].id, { action: 'checkStatus' });
      enableButtons();
    } catch (error) {
      console.log('页面不支持媒体控制:', error);
      disableButtons();
    }
  });
});