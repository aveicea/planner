const NOTION_API_KEY = "secret_pNLmc1M6IlbkoiwoUrKnE2mzJlJGYZ61eppTt5tRZuR";
const DATABASE_ID = "468bf987e6cd4372abf96a8f30f165b1";
const CALENDAR_DB_ID = "ddfee91eec854db08c445b0fa1abd347";
const CORS_PROXY = "https://corsproxy.io/?";

let viewMode = 'timeline';
let currentData = null;
let calendarData = null;
let bookNames = {};
let currentDate = new Date();
let calendarViewMode = false;
let calendarStartDate = new Date();
let calendarEndDate = new Date();

// 전역 함수 등록
window.changeDate = function(days) {
  currentDate.setDate(currentDate.getDate() + days);
  renderData();
};

window.goToday = function() {
  currentDate = new Date();
  renderData();
};

window.toggleCalendarView = async function() {
  calendarViewMode = !calendarViewMode;
  if (calendarViewMode) {
    // 오늘 기준으로 앞으로 2주 보기
    calendarStartDate = new Date();
    calendarStartDate.setHours(0, 0, 0, 0);
    calendarEndDate = new Date(calendarStartDate);
    calendarEndDate.setDate(calendarEndDate.getDate() + 14);
    await fetchCalendarData();
    renderCalendarView();
  } else {
    renderData();
  }
};

window.editTask = async function(taskId) {
  const task = currentData.results.find(t => t.id === taskId);
  if (!task) return;
  
  const title = task.properties?.['범위']?.title?.[0]?.plain_text || '';
  const bookRelation = task.properties?.['책']?.relation?.[0];
  const bookId = bookRelation?.id || '';
  const targetTime = task.properties?.['목표 시간']?.number || '';
  const dateStart = task.properties?.['날짜']?.date?.start || '';
  const start = task.properties?.['시작']?.rich_text?.[0]?.plain_text || '';
  const end = task.properties?.['끝']?.rich_text?.[0]?.plain_text || '';
  const rating = task.properties?.['(੭•̀ᴗ•̀)੭']?.select?.name || '';
  
  const bookList = Object.entries(bookNames).map(([id, name]) => 
    `<option value="${id}" ${id === bookId ? 'selected' : ''}>${name}</option>`
  ).join('');
  
  const content = document.getElementById('content');
  
  content.innerHTML = `
    <div style="padding: 20px;">
      <h3 style="margin-bottom: 12px;">할일 수정</h3>
      
      <label style="display: block; margin-bottom: 4px; font-size: 12px; color: #666;">범위</label>
      <input type="text" id="edit-task-title" value="${title}" placeholder="할일 제목" 
        style="width: 100%; padding: 8px; border: 1px solid #e5e5e7; border-radius: 4px; font-size: 13px; margin-bottom: 12px;">
      
      <label style="display: block; margin-bottom: 4px; font-size: 12px; color: #666;">책</label>
      <select id="edit-task-book" style="width: 100%; padding: 8px; border: 1px solid #e5e5e7; border-radius: 4px; font-size: 13px; margin-bottom: 12px;">
        <option value="">선택 안 함</option>
        ${bookList}
      </select>
      
      <label style="display: block; margin-bottom: 4px; font-size: 12px; color: #666;">목표 시간 (분)</label>
      <input type="number" id="edit-task-time" value="${targetTime}" placeholder="60" 
        style="width: 100%; padding: 8px; border: 1px solid #e5e5e7; border-radius: 4px; font-size: 13px; margin-bottom: 12px;">
      
      <label style="display: block; margin-bottom: 4px; font-size: 12px; color: #666;">날짜</label>
      <input type="date" id="edit-task-date" value="${dateStart}" 
        style="width: 100%; padding: 8px; border: 1px solid #e5e5e7; border-radius: 4px; font-size: 13px; margin-bottom: 12px;">
      
      <label style="display: block; margin-bottom: 4px; font-size: 12px; color: #666;">시작 시간</label>
      <input type="text" id="edit-task-start" value="${start}" placeholder="09:00" 
        style="width: 100%; padding: 8px; border: 1px solid #e5e5e7; border-radius: 4px; font-size: 13px; margin-bottom: 12px;">
      
      <label style="display: block; margin-bottom: 4px; font-size: 12px; color: #666;">끝 시간</label>
      <input type="text" id="edit-task-end" value="${end}" placeholder="10:00" 
        style="width: 100%; padding: 8px; border: 1px solid #e5e5e7; border-radius: 4px; font-size: 13px; margin-bottom: 12px;">
      
      <label style="display: block; margin-bottom: 4px; font-size: 12px; color: #666;">집중도</label>
      <select id="edit-task-rating" style="width: 100%; padding: 8px; border: 1px solid #e5e5e7; border-radius: 4px; font-size: 13px; margin-bottom: 12px;">
        <option value="" ${!rating ? 'selected' : ''}>선택 안 함</option>
        <option value="..." ${rating === '...' ? 'selected' : ''}>...</option>
        <option value="⭐️" ${rating === '⭐️' ? 'selected' : ''}>⭐️</option>
        <option value="⭐️⭐️" ${rating === '⭐️⭐️' ? 'selected' : ''}>⭐️⭐️</option>
        <option value="⭐️⭐️⭐️" ${rating === '⭐️⭐️⭐️' ? 'selected' : ''}>⭐️⭐️⭐️</option>
        <option value="🌟 🌟 🌟" ${rating === '🌟 🌟 🌟' ? 'selected' : ''}>🌟 🌟 🌟</option>
      </select>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
        <button onclick="cancelEdit()" style="padding: 8px; background: #999; color: white; border: none; border-radius: 4px; cursor: pointer;">취소</button>
        <button onclick="confirmEditTask('${taskId}')" style="padding: 8px; background: #007AFF; color: white; border: none; border-radius: 4px; cursor: pointer;">저장</button>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        <button onclick="duplicateTask('${taskId}')" style="padding: 8px; background: #34C759; color: white; border: none; border-radius: 4px; cursor: pointer;">복제</button>
        <button onclick="deleteTask('${taskId}')" style="padding: 8px; background: #FF3B30; color: white; border: none; border-radius: 4px; cursor: pointer;">삭제</button>
      </div>
    </div>
  `;
};

window.duplicateTask = async function(taskId) {
  const task = currentData.results.find(t => t.id === taskId);
  if (!task) return;
  
  const loading = document.getElementById('loading');
  loading.textContent = '⏳';
  
  try {
    const originalTitle = task.properties?.['범위']?.title?.[0]?.plain_text || '';
    
    // (숫자) 찾아서 증가
    const numberMatch = originalTitle.match(/\((\d+)\)$/);
    let newTitle;
    if (numberMatch) {
      const num = parseInt(numberMatch[1]);
      newTitle = originalTitle.replace(/\(\d+\)$/, `(${num + 1})`);
    } else {
      newTitle = originalTitle + ' (2)';
    }
    
    const bookRelation = task.properties?.['책']?.relation?.[0];
    const targetTime = task.properties?.['목표 시간']?.number;
    const dateStart = task.properties?.['날짜']?.date?.start;
    // 시작/끝 시간은 복제하지 않음

    const properties = {
      '범위': {
        title: [{ text: { content: newTitle } }]
      },
      '완료': { checkbox: false }
    };

    if (bookRelation) {
      properties['책'] = { relation: [{ id: bookRelation.id }] };
    }

    if (targetTime) {
      properties['목표 시간'] = { number: targetTime };
    }

    if (dateStart) {
      properties['날짜'] = { date: { start: dateStart } };
    }
    
    // 우선순위 복사
    const priority = task.properties?.['우선순위']?.select?.name;
    if (priority) {
      properties['우선순위'] = { select: { name: priority } };
    }
    
    const notionUrl = 'https://api.notion.com/v1/pages';
    const response = await fetch(`${CORS_PROXY}${encodeURIComponent(notionUrl)}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        parent: { database_id: DATABASE_ID },
        properties: properties
      })
    });

    if (!response.ok) throw new Error('복제 실패');
    
    setTimeout(() => fetchData(), 500);
  } catch (error) {
    alert('복제 실패: ' + error.message);
    loading.textContent = '';
  }
};

window.confirmEditTask = async function(taskId) {
  const titleInput = document.getElementById('edit-task-title');
  const bookSelect = document.getElementById('edit-task-book');
  const timeInput = document.getElementById('edit-task-time');
  const dateInput = document.getElementById('edit-task-date');
  const startInput = document.getElementById('edit-task-start');
  const endInput = document.getElementById('edit-task-end');
  const ratingSelect = document.getElementById('edit-task-rating');
  
  const title = titleInput.value.trim();
  
  if (!title) {
    alert('제목을 입력해주세요!');
    return;
  }
  
  const loading = document.getElementById('loading');
  loading.textContent = '⏳';
  
  try {
    const properties = {
      '범위': {
        title: [{ text: { content: title } }]
      }
    };
    
    if (bookSelect.value) {
      properties['책'] = { relation: [{ id: bookSelect.value }] };
    } else {
      properties['책'] = { relation: [] };
    }
    
    if (timeInput.value) {
      properties['목표 시간'] = { number: parseInt(timeInput.value) };
    }
    
    if (dateInput.value) {
      properties['날짜'] = { date: { start: dateInput.value } };
    }
    
    if (startInput.value) {
      const formattedStart = formatTimeInput(startInput.value);
      properties['시작'] = { rich_text: [{ type: 'text', text: { content: formattedStart } }] };
    }

    if (endInput.value) {
      const formattedEnd = formatTimeInput(endInput.value);
      properties['끝'] = { rich_text: [{ type: 'text', text: { content: formattedEnd } }] };
    }
    
    if (ratingSelect.value) {
      properties['(੭•̀ᴗ•̀)੭'] = { select: { name: ratingSelect.value } };
    } else {
      properties['(੭•̀ᴗ•̀)੭'] = { select: null };
    }
    
    await updateNotionPage(taskId, properties);
    setTimeout(() => fetchData(), 500);
  } catch (error) {
    alert('수정 실패: ' + error.message);
    loading.textContent = '';
  }
};

window.deleteTask = async function(taskId) {
  if (!confirm('정말 삭제하시겠습니까?')) return;
  
  const loading = document.getElementById('loading');
  loading.textContent = '⏳';
  
  try {
    const notionUrl = `https://api.notion.com/v1/pages/${taskId}`;
    const response = await fetch(`${CORS_PROXY}${encodeURIComponent(notionUrl)}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        archived: true
      })
    });

    if (!response.ok) throw new Error('삭제 실패');

    setTimeout(() => fetchData(), 500);
  } catch (error) {
    alert('삭제 실패: ' + error.message);
    loading.textContent = '';
  }
};

window.cancelEdit = function() {
  renderData();
};

window.addNewTask = async function() {
  console.log('addNewTask 호출됨!');
  
  const bookList = Object.entries(bookNames).map(([id, name]) => 
    `<option value="${id}">${name}</option>`
  ).join('');
  
  const content = document.getElementById('content');
  
  content.innerHTML = `
    <div style="padding: 20px;">
      <h3 style="margin-bottom: 12px;">새 할일 추가</h3>
      
      <label style="display: block; margin-bottom: 4px; font-size: 12px; color: #666;">범위</label>
      <input type="text" id="new-task-title" placeholder="할일 제목" 
        style="width: 100%; padding: 8px; border: 1px solid #e5e5e7; border-radius: 4px; font-size: 13px; margin-bottom: 12px;">
      
      <label style="display: block; margin-bottom: 4px; font-size: 12px; color: #666;">책</label>
      <select id="new-task-book" style="width: 100%; padding: 8px; border: 1px solid #e5e5e7; border-radius: 4px; font-size: 13px; margin-bottom: 12px;">
        <option value="">선택 안 함</option>
        ${bookList}
      </select>
      
      <label style="display: block; margin-bottom: 4px; font-size: 12px; color: #666;">목표 시간 (분)</label>
      <input type="number" id="new-task-time" placeholder="60" 
        style="width: 100%; padding: 8px; border: 1px solid #e5e5e7; border-radius: 4px; font-size: 13px; margin-bottom: 12px;">
      
      <div style="display: flex; gap: 8px;">
        <button onclick="confirmAddTask()" style="flex: 1; padding: 8px; background: #007AFF; color: white; border: none; border-radius: 4px; cursor: pointer;">추가</button>
        <button onclick="cancelAddTask()" style="flex: 1; padding: 8px; background: #999; color: white; border: none; border-radius: 4px; cursor: pointer;">취소</button>
      </div>
    </div>
  `;
  
  setTimeout(() => {
    document.getElementById('new-task-title').focus();
  }, 100);
};

window.confirmAddTask = async function() {
  const titleInput = document.getElementById('new-task-title');
  const bookSelect = document.getElementById('new-task-book');
  const timeInput = document.getElementById('new-task-time');
  
  const title = titleInput.value.trim();
  
  if (!title) {
    alert('제목을 입력해주세요!');
    return;
  }
  
  const loading = document.getElementById('loading');
  loading.textContent = '⏳';
  
  try {
    const todayDate = currentDate.toISOString().split('T')[0];
    
    const properties = {
      '범위': {
        title: [{ text: { content: title } }]
      },
      '날짜': {
        date: { start: todayDate }
      },
      '완료': { checkbox: false }
    };
    
    if (bookSelect.value) {
      properties['책'] = {
        relation: [{ id: bookSelect.value }]
      };
    }
    
    if (timeInput.value) {
      properties['목표 시간'] = {
        number: parseInt(timeInput.value)
      };
    }
    
    const existingPriorities = currentData.results
      .map(t => t.properties?.['우선순위']?.select?.name)
      .filter(Boolean)
      .map(p => parseInt(p.replace(/\D/g, '')));
    
    const nextPriority = existingPriorities.length > 0 
      ? Math.max(...existingPriorities) + 1 
      : 1;
    
    if (nextPriority <= 10) {
      const priorityOrder = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
      properties['우선순위'] = {
        select: { name: priorityOrder[nextPriority - 1] }
      };
    }
    
    const notionUrl = 'https://api.notion.com/v1/pages';
    const response = await fetch(`${CORS_PROXY}${encodeURIComponent(notionUrl)}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        parent: { database_id: DATABASE_ID },
        properties: properties
      })
    });

    const result = await response.json();
    console.log('추가 결과:', result);

    if (!response.ok) {
      throw new Error(result.message || '추가 실패');
    }
    
    setTimeout(() => fetchData(), 500);
  } catch (error) {
    console.error('할일 추가 오류:', error);
    alert('할일 추가 실패: ' + error.message);
  } finally {
    loading.textContent = '';
  }
};

window.cancelAddTask = function() {
  renderData();
};

window.toggleComplete = async function(taskId, completed) {
  const loading = document.getElementById('loading');
  loading.textContent = '⏳';
  
  try {
    await updateNotionPage(taskId, {
      '완료': { checkbox: completed }
    });
    setTimeout(() => fetchData(), 500);
  } catch (error) {
    alert('업데이트 실패: ' + error.message);
    loading.textContent = '';
  }
};

window.formatTimeInput = function(value) {
  // 빈 값이면 그대로 반환
  if (!value || !value.trim()) return value;

  // 이미 콜론이 있으면 그대로 반환
  if (value.includes(':')) return value;

  // 숫자만 추출
  const numbers = value.replace(/\D/g, '');

  // 숫자가 없으면 빈 문자열
  if (!numbers) return '';

  // 길이에 따라 포맷팅
  if (numbers.length <= 2) {
    // 1자리나 2자리: 시간만 (예: 9 -> 09:00, 11 -> 11:00)
    return numbers.padStart(2, '0') + ':00';
  } else if (numbers.length === 3) {
    // 3자리: 첫 자리는 시간, 나머지는 분 (예: 930 -> 09:30)
    return '0' + numbers[0] + ':' + numbers.slice(1);
  } else {
    // 4자리 이상: 앞 2자리 시간, 다음 2자리 분 (예: 1130 -> 11:30)
    return numbers.slice(0, 2) + ':' + numbers.slice(2, 4);
  }
};

window.updateTime = async function(taskId, field, value, inputElement) {
  // 시간 포맷 자동 변환
  const formattedValue = formatTimeInput(value);

  // 입력 필드 업데이트
  if (inputElement) {
    inputElement.value = formattedValue;
  }

  if (!formattedValue.trim()) return;

  const loading = document.getElementById('loading');
  loading.textContent = '⏳';

  try {
    await updateNotionPage(taskId, {
      [field]: {
        rich_text: [{ type: 'text', text: { content: formattedValue } }]
      }
    });
    setTimeout(() => fetchData(), 500);
  } catch (error) {
    alert('시간 업데이트 실패: ' + error.message);
    loading.textContent = '';
  }
};

window.updateDate = async function(taskId, newDate) {
  if (!newDate) return;
  
  const task = currentData.results.find(t => t.id === taskId);
  if (!task) return;
  
  const originalDate = task.properties?.['날짜']?.date?.start;
  
  // 날짜가 실제로 바뀌었는지 확인
  if (originalDate === newDate) return;
  
  const loading = document.getElementById('loading');
  loading.textContent = '⏳';
  
  try {
    // 복제 + 제목에 ' 추가
    const originalTitle = task.properties?.['범위']?.title?.[0]?.plain_text || '';
    const newTitle = originalTitle + "'";
    
    const bookRelation = task.properties?.['책']?.relation?.[0];
    const targetTime = task.properties?.['목표 시간']?.number;
    const start = task.properties?.['시작']?.rich_text?.[0]?.plain_text;
    const end = task.properties?.['끝']?.rich_text?.[0]?.plain_text;
    const rating = task.properties?.['(੭•̀ᴗ•̀)੭']?.select?.name;
    const priority = task.properties?.['우선순위']?.select?.name;
    
    const properties = {
      '범위': {
        title: [{ text: { content: newTitle } }]
      },
      '날짜': {
        date: { start: newDate }
      },
      '완료': { checkbox: false }
    };
    
    if (bookRelation) {
      properties['책'] = { relation: [{ id: bookRelation.id }] };
    }
    
    if (targetTime) {
      properties['목표 시간'] = { number: targetTime };
    }
    
    if (start) {
      properties['시작'] = { rich_text: [{ type: 'text', text: { content: start } }] };
    }
    
    if (end) {
      properties['끝'] = { rich_text: [{ type: 'text', text: { content: end } }] };
    }
    
    if (rating) {
      properties['(੭•̀ᴗ•̀)੭'] = { select: { name: rating } };
    }
    
    if (priority) {
      properties['우선순위'] = { select: { name: priority } };
    }
    
    const notionUrl = 'https://api.notion.com/v1/pages';
    const response = await fetch(`${CORS_PROXY}${encodeURIComponent(notionUrl)}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        parent: { database_id: DATABASE_ID },
        properties: properties
      })
    });

    if (!response.ok) throw new Error('복제 실패');
    
    setTimeout(() => fetchData(), 500);
  } catch (error) {
    alert('날짜 변경 실패: ' + error.message);
    loading.textContent = '';
  }
};

window.updateDateInTask = async function(taskId, newDate) {
  if (!newDate) return;
  
  const task = currentData.results.find(t => t.id === taskId);
  if (!task) return;
  
  const originalDate = task.properties?.['날짜']?.date?.start;
  
  if (originalDate === newDate) return;
  
  const loading = document.getElementById('loading');
  loading.textContent = '⏳';
  
  try {
    const originalTitle = task.properties?.['범위']?.title?.[0]?.plain_text || '';
    const newTitle = originalTitle + "'";
    
    const bookRelation = task.properties?.['책']?.relation?.[0];
    const targetTime = task.properties?.['목표 시간']?.number;
    const start = task.properties?.['시작']?.rich_text?.[0]?.plain_text;
    const end = task.properties?.['끝']?.rich_text?.[0]?.plain_text;
    const rating = task.properties?.['(੭•̀ᴗ•̀)੭']?.select?.name;
    const priority = task.properties?.['우선순위']?.select?.name;
    
    const properties = {
      '범위': {
        title: [{ text: { content: newTitle } }]
      },
      '날짜': {
        date: { start: newDate }
      },
      '완료': { checkbox: false }
    };
    
    if (bookRelation) {
      properties['책'] = { relation: [{ id: bookRelation.id }] };
    }
    
    if (targetTime) {
      properties['목표 시간'] = { number: targetTime };
    }
    
    if (start) {
      properties['시작'] = { rich_text: [{ type: 'text', text: { content: start } }] };
    }
    
    if (end) {
      properties['끝'] = { rich_text: [{ type: 'text', text: { content: end } }] };
    }
    
    if (rating) {
      properties['(੭•̀ᴗ•̀)੭'] = { select: { name: rating } };
    }
    
    if (priority) {
      properties['우선순위'] = { select: { name: priority } };
    }
    
    const notionUrl = 'https://api.notion.com/v1/pages';
    const response = await fetch(`${CORS_PROXY}${encodeURIComponent(notionUrl)}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        parent: { database_id: DATABASE_ID },
        properties: properties
      })
    });

    if (!response.ok) throw new Error('복제 실패');
    
    setTimeout(() => fetchData(), 500);
  } catch (error) {
    alert('날짜 변경 실패: ' + error.message);
    loading.textContent = '';
  }
};

window.updateRating = async function(taskId, value) {
  const loading = document.getElementById('loading');
  loading.textContent = '⏳';
  
  try {
    await updateNotionPage(taskId, {
      '(੭•̀ᴗ•̀)੭': value ? { select: { name: value } } : { select: null }
    });
    setTimeout(() => fetchData(), 500);
  } catch (error) {
    alert('집중도 업데이트 실패: ' + error.message);
    loading.textContent = '';
  }
};

document.addEventListener('DOMContentLoaded', () => {
  fetchData();
  setupEventListeners();
  setInterval(fetchData, 300000);
  
  setInterval(() => {
    console.log('keepalive');
  }, 60000);
});

function setupEventListeners() {
  const viewToggle = document.getElementById('view-toggle');
  viewToggle.addEventListener('click', () => {
    viewMode = viewMode === 'timeline' ? 'task' : 'timeline';
    viewToggle.textContent = viewMode === 'timeline' ? 'TIME TABLE' : 'TASK';
    renderData();
  });
}

async function fetchData(retryCount = 0) {
  const loading = document.getElementById('loading');
  loading.textContent = '⏳';

  try {
    const notionUrl = `https://api.notion.com/v1/databases/${DATABASE_ID}/query`;
    const response = await fetch(`${CORS_PROXY}${encodeURIComponent(notionUrl)}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        page_size: 100,
        sorts: [{ property: "날짜", direction: "descending" }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API Error ${response.status}: ${errorData.message || response.statusText}`);
    }

    currentData = await response.json();
    await fetchBookNames();
    renderData();
    updateLastUpdateTime();
  } catch (error) {
    console.error('Error:', error);

    // Determine error type and provide specific message
    let errorMessage = '';
    if (error.message.includes('Failed to fetch')) {
      errorMessage = `네트워크 연결을 확인해주세요.\n\n가능한 원인:\n• 인터넷 연결 끊김\n• CORS 문제 (브라우저에서 직접 실행 시)\n• API 키 만료\n\n해결 방법:\n• 인터넷 연결 확인\n• 로컬 서버에서 실행 (예: Live Server)\n• API 키 갱신`;
    } else if (error.message.includes('401')) {
      errorMessage = 'API 키가 유효하지 않습니다. Notion API 키를 확인해주세요.';
    } else if (error.message.includes('404')) {
      errorMessage = '데이터베이스를 찾을 수 없습니다. DATABASE_ID를 확인해주세요.';
    } else if (error.message.includes('429')) {
      errorMessage = 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.';
    } else {
      errorMessage = error.message;
    }

    // Retry logic for network errors
    if (error.message.includes('Failed to fetch') && retryCount < 3) {
      const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
      console.log(`Retrying in ${delay}ms... (attempt ${retryCount + 1}/3)`);
      document.getElementById('content').innerHTML =
        `<div class="empty-message">⚠️ 연결 중... (${retryCount + 1}/3)<br><br>${errorMessage}</div>`;
      setTimeout(() => fetchData(retryCount + 1), delay);
      return;
    }

    document.getElementById('content').innerHTML =
      `<div class="empty-message" style="white-space: pre-line;">❌ 오류\n\n${errorMessage}</div>`;
  } finally {
    loading.textContent = '';
  }
}

async function fetchBookNames() {
  const bookIds = new Set();

  // planner 데이터베이스의 책 ID 수집
  currentData.results.forEach(task => {
    const bookRelations = task.properties?.['책']?.relation || [];
    bookRelations.forEach(rel => bookIds.add(rel.id));
  });

  // calendar 데이터베이스의 책 ID 수집
  if (calendarData && calendarData.results) {
    calendarData.results.forEach(task => {
      const bookRelations = task.properties?.['책']?.relation || [];
      bookRelations.forEach(rel => bookIds.add(rel.id));
    });
  }

  for (const bookId of bookIds) {
    if (!bookNames[bookId]) {
      try {
        const notionUrl = `https://api.notion.com/v1/pages/${bookId}`;
        const response = await fetch(`${CORS_PROXY}${encodeURIComponent(notionUrl)}`, {
          headers: {
            'Authorization': `Bearer ${NOTION_API_KEY}`,
            'Notion-Version': '2022-06-28'
          }
        });

        if (response.ok) {
          const bookData = await response.json();
          for (const [key, value] of Object.entries(bookData.properties)) {
            if (value.type === 'title' && value.title && value.title.length > 0) {
              bookNames[bookId] = value.title[0].plain_text;
              break;
            }
          }
          if (!bookNames[bookId]) bookNames[bookId] = '책';
        } else {
          console.warn(`Failed to fetch book ${bookId}: ${response.status}`);
          bookNames[bookId] = '책';
        }
      } catch (error) {
        console.warn(`Error fetching book ${bookId}:`, error);
        bookNames[bookId] = '책';
      }
    }
  }
}

function getTaskTitle(task) {
  const scope = task.properties?.['범위']?.title?.[0]?.plain_text || '제목 없음';
  const bookRelation = task.properties?.['책']?.relation?.[0];

  if (bookRelation && bookNames[bookRelation.id]) {
    return `[${bookNames[bookRelation.id]}] ${scope}`;
  }
  return scope;
}

function getCalendarItemTitle(item) {
  // 여러 가능한 속성 이름 시도
  let title = null;

  // 먼저 '범위' 속성 시도
  if (item.properties?.['범위']?.title?.[0]?.plain_text) {
    title = item.properties['범위'].title[0].plain_text;
  }

  // 'pre-plan' 속성 시도
  if (!title && item.properties?.['pre-plan']?.title?.[0]?.plain_text) {
    title = item.properties['pre-plan'].title[0].plain_text;
  }

  // 모든 title 타입 속성 찾기
  if (!title) {
    for (const [key, value] of Object.entries(item.properties || {})) {
      if (value.type === 'title' && value.title && value.title.length > 0) {
        title = value.title[0].plain_text;
        break;
      }
    }
  }

  return title || '제목 없음';
}

function renderData() {
  if (!currentData || !currentData.results) return;

  if (viewMode === 'timeline') {
    renderTimelineView();
  } else {
    renderTaskView();
  }
}

function renderTimelineView() {
  const targetDateStr = currentDate.toISOString().split('T')[0];
  
  const dayTasks = currentData.results.filter(item => {
    const dateStart = item.properties?.['날짜']?.date?.start;
    return dateStart && dateStart === targetDateStr;
  });

  // 완료 안 한 일 먼저, 그 다음 완료한 일
  const incompleteTasks = dayTasks.filter(t => !t.properties?.['완료']?.checkbox);
  const completedTasks = dayTasks.filter(t => t.properties?.['완료']?.checkbox);
  
  const sortTasks = (tasks) => {
    return tasks.sort((a, b) => {
      const aStart = a.properties?.['시작']?.rich_text?.[0]?.plain_text || '';
      const bStart = b.properties?.['시작']?.rich_text?.[0]?.plain_text || '';
      
      if (aStart && bStart) return aStart.localeCompare(bStart);
      if (aStart) return -1;
      if (bStart) return 1;
      
      const priorityOrder = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
      const aPriority = a.properties?.['우선순위']?.select?.name || '10th';
      const bPriority = b.properties?.['우선순위']?.select?.name || '10th';
      const priorityCompare = priorityOrder.indexOf(aPriority) - priorityOrder.indexOf(bPriority);
      
      if (priorityCompare !== 0) return priorityCompare;
      
      const aTitle = getTaskTitle(a);
      const bTitle = getTaskTitle(b);
      return aTitle.localeCompare(bTitle);
    });
  };
  
  const sortedTasks = [...sortTasks(incompleteTasks), ...sortTasks(completedTasks)];

  const content = document.getElementById('content');
  const dateLabel = formatDateLabel(targetDateStr);
  
  let html = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
      <button onclick="changeDate(-1)" style="font-size: 16px; padding: 4px 12px; color: #999;">◀</button>
      <h3 class="section-title" style="margin: 0; cursor: pointer;" onclick="goToday()">${dateLabel} (${sortedTasks.length}개)</h3>
      <button onclick="changeDate(1)" style="font-size: 16px; padding: 4px 12px; color: #999;">▶</button>
    </div>
    <div class="task-list">
  `;
  
  if (sortedTasks.length === 0) {
    html += '<div class="empty-message">일정이 없습니다.</div>';
  } else {
    sortedTasks.forEach(task => {
      const title = getTaskTitle(task);
      const start = task.properties?.['시작']?.rich_text?.[0]?.plain_text || '';
      const end = task.properties?.['끝']?.rich_text?.[0]?.plain_text || '';
      const completed = task.properties?.['완료']?.checkbox;
      const rating = task.properties?.['(੭•̀ᴗ•̀)੭']?.select?.name || '';
      const targetTime = task.properties?.['목표 시간']?.number || 0;
      
      // 끝시간 없으면 실제 0분
      let actualTime = 0;
      let diffStr = '';
      
      if (end) {
        const actualProp = task.properties?.['실제 시간'];
        
        if (actualProp?.type === 'formula') {
          if (actualProp.formula?.type === 'number') {
            actualTime = actualProp.formula.number || 0;
          } else if (actualProp.formula?.type === 'string') {
            const str = actualProp.formula.string || '';
            const hourMatch = str.match(/(\d+)시간/);
            const minMatch = str.match(/(\d+)분/);
            const hours = hourMatch ? parseInt(hourMatch[1]) : 0;
            const mins = minMatch ? parseInt(minMatch[1]) : 0;
            actualTime = hours * 60 + mins;
          }
        }
        
        const diff = actualTime - targetTime;
        diffStr = diff === 0 ? '' : `${diff > 0 ? '+' : ''}${diff}`;
      }
      
      const dateStart = task.properties?.['날짜']?.date?.start || '';

      html += `
        <div class="task-item ${completed ? 'completed' : ''}">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <div class="task-title ${completed ? 'completed' : ''}" style="flex: 1; cursor: pointer;" onclick="editTask('${task.id}')">${title}</div>
            <div class="checkbox ${completed ? 'checked' : ''}" onclick="toggleComplete('${task.id}', ${!completed})" 
              style="margin-left: 12px; flex-shrink: 0;">
              ${completed ? '✓' : ''}
            </div>
          </div>
          
          <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px;">
            <input type="text" value="${start}" placeholder="시작"
              onblur="updateTime('${task.id}', '시작', this.value, this)"
              style="width: 50px; padding: 4px; border: 1px solid #e5e5e7; border-radius: 4px; text-align: center; font-size: 11px;">
            <span style="font-size: 11px; color: #86868b;">-</span>
            <input type="text" value="${end}" placeholder="끝"
              onblur="updateTime('${task.id}', '끝', this.value, this)"
              style="width: 50px; padding: 4px; border: 1px solid #e5e5e7; border-radius: 4px; text-align: center; font-size: 11px;">
            
            <select onchange="updateRating('${task.id}', this.value)" 
              style="margin-left: 8px; padding: 4px 8px; border: 1px solid #e5e5e7; border-radius: 4px; font-size: 11px; cursor: pointer; background: #f5f5f7; color: ${rating ? '#333' : '#999'};">
              <option value="" ${!rating ? 'selected' : ''}></option>
              <option value="..." ${rating === '...' ? 'selected' : ''}>...</option>
              <option value="⭐️" ${rating === '⭐️' ? 'selected' : ''}>⭐️</option>
              <option value="⭐️⭐️" ${rating === '⭐️⭐️' ? 'selected' : ''}>⭐️⭐️</option>
              <option value="⭐️⭐️⭐️" ${rating === '⭐️⭐️⭐️' ? 'selected' : ''}>⭐️⭐️⭐️</option>
              <option value="🌟 🌟 🌟" ${rating === '🌟 🌟 🌟' ? 'selected' : ''}>🌟 🌟 🌟</option>
            </select>
          </div>
          
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; gap: 8px; font-size: 11px; color: #86868b;">
              <span>⏱ 목표 ${targetTime}분</span>
              <span>⏳ 실제 ${actualTime}분</span>
              ${diffStr ? `<span>📊 계획 ${diffStr}분</span>` : ''}
            </div>
            <span style="cursor: pointer; font-size: 16px; position: relative; display: inline-block; width: 20px; height: 20px; flex-shrink: 0;">
              📅
              <input type="date" value="${dateStart}" 
                onchange="updateDate('${task.id}', this.value)"
                style="position: absolute; left: 0; top: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer;">
            </span>
          </div>
        </div>
      `;
    });
  }
  
  html += '</div>';
  content.innerHTML = html;
}

function renderTaskView() {
  const targetDateStr = currentDate.toISOString().split('T')[0];
  
  // 날짜 필터
  const dayTasks = currentData.results.filter(item => {
    const dateStart = item.properties?.['날짜']?.date?.start;
    return dateStart && dateStart === targetDateStr;
  });
  
  // 완료 안 한 일 먼저
  const incompleteTasks = dayTasks.filter(t => !t.properties?.['완료']?.checkbox);
  const completedTasks = dayTasks.filter(t => t.properties?.['완료']?.checkbox);
  
  const priorityOrder = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
  
  const sortByPriority = (tasks) => {
    return tasks.sort((a, b) => {
      const aPriority = a.properties?.['우선순위']?.select?.name || '10th';
      const bPriority = b.properties?.['우선순위']?.select?.name || '10th';
      return priorityOrder.indexOf(aPriority) - priorityOrder.indexOf(bPriority);
    });
  };
  
  const allTasks = [...sortByPriority(incompleteTasks), ...sortByPriority(completedTasks)];

  const content = document.getElementById('content');
  const dateLabel = formatDateLabel(targetDateStr);
  
  let html = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
      <button onclick="changeDate(-1)" style="font-size: 16px; padding: 4px 12px; color: #999;">◀</button>
      <h3 class="section-title" style="margin: 0; cursor: pointer;" onclick="goToday()">${dateLabel}</h3>
      <button onclick="changeDate(1)" style="font-size: 16px; padding: 4px 12px; color: #999;">▶</button>
    </div>
    <button onclick="addNewTask()" style="width: 100%; margin-bottom: 12px; padding: 8px; background: #999; color: white; border-radius: 8px; cursor: pointer; border: none; font-size: 13px;">+ 할일 추가</button>
    <div class="task-list" id="task-sortable">
  `;
  
  allTasks.forEach(task => {
    const title = getTaskTitle(task);
    const priority = task.properties?.['우선순위']?.select?.name;
    const targetTime = task.properties?.['목표 시간']?.number;
    const dateStart = task.properties?.['날짜']?.date?.start || '';
    const completed = task.properties?.['완료']?.checkbox;

    html += `
      <div class="task-item ${completed ? 'completed' : ''}" data-id="${task.id}" style="border-left: 3px solid #999; cursor: move;">
        <div class="task-header">
          <div class="task-content" style="flex: 1;">
            <div class="task-title ${completed ? 'completed' : ''}" style="cursor: pointer;" onclick="editTask('${task.id}')">${title}</div>
            <div style="font-size: 11px; color: #86868b; margin-top: 6px; display: flex; gap: 8px; align-items: center;">
              ${priority ? `<span style="background: #999; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px;">${priority}</span>` : ''}
              ${targetTime ? `<span>⏱ ${targetTime}분</span>` : ''}
              ${dateStart ? `<span style="font-size: 10px;">${formatDateShort(dateStart)}</span>` : ''}
              <span style="cursor: pointer; font-size: 14px; position: relative; display: inline-block; width: 18px; height: 18px;">
                📅
                <input type="date" value="${dateStart}" 
                  onchange="updateDateInTask('${task.id}', this.value)"
                  style="position: absolute; left: 0; top: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer;">
              </span>
            </div>
          </div>
          <div class="checkbox ${completed ? 'checked' : ''}" onclick="toggleComplete('${task.id}', ${!completed})"
            style="margin-left: 12px; flex-shrink: 0;">
            ${completed ? '✓' : ''}
          </div>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  content.innerHTML = html;
  
  initSortable();
}

function initSortable() {
  const container = document.getElementById('task-sortable');
  if (!container) return;
  
  let draggedItem = null;
  let dragStartIndex = -1;
  
  container.addEventListener('dragstart', (e) => {
    if (e.target.classList.contains('task-item')) {
      draggedItem = e.target;
      dragStartIndex = Array.from(container.children).indexOf(draggedItem);
      e.target.style.opacity = '0.5';
    }
  });
  
  container.addEventListener('dragend', async (e) => {
    if (e.target.classList.contains('task-item')) {
      e.target.style.opacity = '1';
      
      const dragEndIndex = Array.from(container.children).indexOf(draggedItem);
      
      if (dragStartIndex !== dragEndIndex) {
        await updateTaskOrder();
      }
    }
  });
  
  container.addEventListener('dragover', (e) => {
    e.preventDefault();
    const afterElement = getDragAfterElement(container, e.clientY);
    if (afterElement == null) {
      container.appendChild(draggedItem);
    } else {
      container.insertBefore(draggedItem, afterElement);
    }
  });
  
  container.querySelectorAll('.task-item').forEach(item => {
    item.setAttribute('draggable', 'true');
  });
}

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.task-item:not([style*="opacity: 0.5"])')];
  
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

async function updateTaskOrder() {
  const container = document.getElementById('task-sortable');
  const items = container.querySelectorAll('.task-item');
  const priorityOrder = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
  
  const loading = document.getElementById('loading');
  loading.textContent = '⏳';
  
  const updates = [];
  for (let i = 0; i < items.length && i < 10; i++) {
    const taskId = items[i].getAttribute('data-id');
    const newPriority = priorityOrder[i];
    
    updates.push(
      updateNotionPage(taskId, {
        '우선순위': { select: { name: newPriority } }
      })
    );
  }
  
  await Promise.all(updates);
  
  setTimeout(() => fetchData(), 1000);
}

async function updateNotionPage(pageId, properties) {
  const notionUrl = `https://api.notion.com/v1/pages/${pageId}`;
  const response = await fetch(`${CORS_PROXY}${encodeURIComponent(notionUrl)}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${NOTION_API_KEY}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ properties })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Update failed: ${response.status}`);
  }

  return await response.json();
}

function formatDateLabel(dateString) {
  const date = new Date(dateString);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const dayOfWeek = days[date.getDay()];
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${dayOfWeek})`;
}

function formatDateShort(dateString) {
  const date = new Date(dateString);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function updateLastUpdateTime() {
  const now = new Date();
  document.getElementById('last-update').textContent =
    now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

async function fetchCalendarData() {
  const loading = document.getElementById('loading');
  loading.textContent = '⏳';

  try {
    const notionUrl = `https://api.notion.com/v1/databases/${CALENDAR_DB_ID}/query`;
    const response = await fetch(`${CORS_PROXY}${encodeURIComponent(notionUrl)}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        page_size: 100,
        sorts: [{ property: "날짜", direction: "descending" }]
      })
    });

    if (!response.ok) {
      throw new Error(`Calendar API Error: ${response.status}`);
    }

    calendarData = await response.json();
    await fetchBookNames();
  } catch (error) {
    console.error('Calendar fetch error:', error);
    alert('달력 데이터를 불러오는데 실패했습니다: ' + error.message);
  } finally {
    loading.textContent = '';
  }
}

window.updateCalendarItemDate = async function(itemId, newDate) {
  const item = calendarData.results.find(t => t.id === itemId);
  if (item && item.properties?.['날짜']) {
    item.properties['날짜'].date = { start: newDate };

    // 노션에 실제로 날짜 업데이트
    try {
      const notionUrl = `https://api.notion.com/v1/pages/${itemId}`;
      const response = await fetch(`${CORS_PROXY}${encodeURIComponent(notionUrl)}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${NOTION_API_KEY}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: {
            '날짜': { date: { start: newDate } }
          }
        })
      });

      if (!response.ok) {
        throw new Error('날짜 업데이트 실패');
      }
    } catch (error) {
      console.error('Error updating date:', error);
      alert('노션에 날짜를 저장하는데 실패했습니다: ' + error.message);
    }
  }
};

window.loadPrevCalendar = function() {
  calendarStartDate.setDate(calendarStartDate.getDate() - 14);
  renderCalendarView();
};

window.loadNextCalendar = function() {
  calendarEndDate.setDate(calendarEndDate.getDate() + 14);
  renderCalendarView();
};

window.saveToPlanner = async function(dateStr) {
  const loading = document.getElementById('loading');
  loading.textContent = '⏳';

  try {
    const itemsOnDate = calendarData.results.filter(item => {
      const itemDate = item.properties?.['날짜']?.date?.start;
      return itemDate === dateStr;
    });

    for (const item of itemsOnDate) {
      const title = getCalendarItemTitle(item);
      const bookRelation = item.properties?.['책']?.relation?.[0];

      const properties = {
        '범위': {
          title: [{ text: { content: title } }]
        },
        '날짜': {
          date: { start: dateStr }
        },
        '완료': { checkbox: false }
      };

      if (bookRelation) {
        properties['책'] = { relation: [{ id: bookRelation.id }] };
      }

      const notionUrl = 'https://api.notion.com/v1/pages';
      const response = await fetch(`${CORS_PROXY}${encodeURIComponent(notionUrl)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NOTION_API_KEY}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          parent: { database_id: DATABASE_ID },
          properties: properties
        })
      });

      if (!response.ok) {
        throw new Error('플래너에 저장 실패');
      }
    }

    alert(`${itemsOnDate.length}개 항목이 플래너에 저장되었습니다!`);
    await fetchData();
  } catch (error) {
    console.error('Save error:', error);
    alert('플래너에 저장하는데 실패했습니다: ' + error.message);
  } finally {
    loading.textContent = '';
  }
};

function renderCalendarView() {
  if (!calendarData || !calendarData.results) return;

  const content = document.getElementById('content');

  // 날짜별로 그룹화
  const groupedByDate = {};
  calendarData.results.forEach(item => {
    const dateStart = item.properties?.['날짜']?.date?.start;
    if (dateStart) {
      if (!groupedByDate[dateStart]) {
        groupedByDate[dateStart] = [];
      }
      groupedByDate[dateStart].push(item);
    }
  });

  // 날짜 필터링: calendarStartDate부터 calendarEndDate까지
  const filteredDates = Object.keys(groupedByDate).filter(dateStr => {
    const date = new Date(dateStr);
    return date >= calendarStartDate && date < calendarEndDate;
  });

  // 날짜 정렬 (오름차순)
  const sortedDates = filteredDates.sort();

  let html = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
      <h3 class="section-title" style="margin: 0;">📅 달력</h3>
      <button onclick="toggleCalendarView()" style="font-size: 12px; padding: 4px 8px;">닫기</button>
    </div>
    <button onclick="loadPrevCalendar()" style="width: 100%; background: #e5e5e7; color: #333; border: none; border-radius: 4px; padding: 8px; font-size: 11px; cursor: pointer; margin-bottom: 12px;">⬆ 이전 2주 더보기</button>
  `;

  sortedDates.forEach(dateStr => {
    const items = groupedByDate[dateStr];
    const dateLabel = formatDateLabel(dateStr);

    html += `
      <div style="margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <h4 style="font-size: 13px; font-weight: 600; color: #666; margin: 0;">${dateLabel}</h4>
          <button onclick="saveToPlanner('${dateStr}')" style="background: #999; color: white; border: none; border-radius: 4px; padding: 4px 12px; font-size: 11px; cursor: pointer;">💾 저장</button>
        </div>
        <div class="calendar-date-group" data-date="${dateStr}">
    `;

    items.forEach(item => {
      const title = getCalendarItemTitle(item);
      const bookRelation = item.properties?.['책']?.relation?.[0];
      const bookName = bookRelation && bookNames[bookRelation.id] ? bookNames[bookRelation.id] : '';
      const displayTitle = bookName ? `[${bookName}] ${title}` : title;

      html += `
        <div class="calendar-item" draggable="true" data-id="${item.id}" data-date="${dateStr}">
          <div style="font-size: 12px; color: #333;">${displayTitle}</div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;
  });

  html += `
    <button onclick="loadNextCalendar()" style="width: 100%; background: #e5e5e7; color: #333; border: none; border-radius: 4px; padding: 8px; font-size: 11px; cursor: pointer; margin-top: 4px;">⬇ 다음 2주 더보기</button>
  `;

  content.innerHTML = html;
  initCalendarDragDrop();
}

function initCalendarDragDrop() {
  const items = document.querySelectorAll('.calendar-item');
  const groups = document.querySelectorAll('.calendar-date-group');

  let draggedItem = null;

  items.forEach(item => {
    item.addEventListener('dragstart', (e) => {
      draggedItem = item;
      item.style.opacity = '0.5';
    });

    item.addEventListener('dragend', (e) => {
      item.style.opacity = '1';
    });
  });

  groups.forEach(group => {
    group.addEventListener('dragover', (e) => {
      e.preventDefault();
      group.style.background = '#f0f0f0';
    });

    group.addEventListener('dragleave', (e) => {
      group.style.background = 'transparent';
    });

    group.addEventListener('drop', (e) => {
      e.preventDefault();
      group.style.background = 'transparent';

      if (draggedItem) {
        const newDate = group.getAttribute('data-date');
        const itemId = draggedItem.getAttribute('data-id');

        draggedItem.setAttribute('data-date', newDate);
        group.appendChild(draggedItem);

        updateCalendarItemDate(itemId, newDate);
      }
    });
  });
}
