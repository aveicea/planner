// Notion Planner Widget for Übersicht
// 노션 API를 사용한 플래너 위젯 (편집 가능)

export const refreshFrequency = 300000; // 5분마다 새로고침

// 노션 API 설정
const NOTION_API_KEY = "secret_pNLmc1M6IlbkoiwoUrKnE2mzJlJGYZ61eppTt5tRZuR";
const DATABASE_ID = "468bf987e6cd4372abf96a8f30f165b1";

// CSS 스타일
export const className = {
  top: "20px",
  right: "20px",
  width: "420px",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontSize: "13px",
  color: "#333",
  backgroundColor: "rgba(255, 255, 255, 0.95)",
  backdropFilter: "blur(20px)",
  borderRadius: "16px",
  padding: "20px",
  boxShadow: "0 10px 40px rgba(0, 0, 0, 0.15)",
  transition: "all 0.3s ease"
};

// 노션 API 호출
export const command = async (dispatch) => {
  try {
    const response = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        page_size: 20,
        sorts: [
          {
            property: "날짜",
            direction: "descending"
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    dispatch({ type: 'DATA_FETCHED', data });
  } catch (error) {
    dispatch({ type: 'ERROR', error: error.message });
  }
};

// 상태 관리
export const initialState = {
  data: null,
  error: null,
  viewMode: 'timeline', // 'timeline' or 'task'
  updating: false
};

export const updateState = (event, previousState) => {
  if (event.type === 'DATA_FETCHED') {
    return { ...previousState, data: event.data, error: null, updating: false };
  }
  if (event.type === 'ERROR') {
    return { ...previousState, error: event.error, updating: false };
  }
  if (event.type === 'TOGGLE_VIEW') {
    const newMode = previousState.viewMode === 'timeline' ? 'task' : 'timeline';
    return { ...previousState, viewMode: newMode };
  }
  if (event.type === 'START_UPDATE') {
    return { ...previousState, updating: true };
  }
  if (event.type === 'UPDATE_SUCCESS') {
    return { ...previousState, updating: false };
  }
  return previousState;
};

// 노션 페이지 업데이트 함수
const updateNotionPage = async (pageId, properties) => {
  try {
    const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
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
  } catch (error) {
    console.error('Update error:', error);
    throw error;
  }
};

// 날짜 포맷 함수
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}/${day}`;
};

// 오늘 날짜인지 확인
const isToday = (dateString) => {
  const today = new Date();
  const date = new Date(dateString);
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

// 우선순위 색상
const getPriorityColor = (priority) => {
  const colors = {
    '1st': '#FF9500',
    '2nd': '#999',
    '3rd': '#FF3B30',
    '4th': '#34C759',
    '5th': '#8E8D93'
  };
  return colors[priority] || '#999';
};

// 렌더링
export const render = ({ data, error, viewMode, updating }, dispatch) => {
  if (error) {
    return (
      <div style={{ color: '#FF3B30' }}>
        ❌ 오류: {error}
      </div>
    );
  }

  if (!data || !data.results) {
    return <div>데이터 로딩 중...</div>;
  }

  // 오늘 날짜 데이터 필터링
  const todayTasks = data.results.filter(item => {
    const dateStart = item.properties?.['날짜']?.date?.start;
    return dateStart && isToday(dateStart);
  });

  // 미완료 태스크 필터링 및 정렬
  const incompleteTasks = data.results
    .filter(item => {
      const completed = item.properties?.['완료']?.checkbox;
      return !completed;
    })
    .sort((a, b) => {
      const priorityOrder = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
      const aPriority = a.properties?.['우선순위']?.select?.name || '10th';
      const bPriority = b.properties?.['우선순위']?.select?.name || '10th';
      return priorityOrder.indexOf(aPriority) - priorityOrder.indexOf(bPriority);
    });

  const handleToggleView = () => {
    dispatch({ type: 'TOGGLE_VIEW' });
  };

  // 체크박스 토글
  const handleToggleComplete = async (task, e) => {
    e.preventDefault();
    const currentStatus = task.properties?.['완료']?.checkbox || false;
    
    dispatch({ type: 'START_UPDATE' });
    
    try {
      await updateNotionPage(task.id, {
        '완료': {
          checkbox: !currentStatus
        }
      });
      
      // 데이터 다시 로드
      setTimeout(() => {
        dispatch({ type: 'UPDATE_SUCCESS' });
        command(dispatch);
      }, 500);
    } catch (error) {
      alert('업데이트 실패: ' + error.message);
      dispatch({ type: 'ERROR', error: error.message });
    }
  };

  // 시간 업데이트 (blur 이벤트에서 실행)
  const handleTimeUpdate = async (task, field, value, e) => {
    e.preventDefault();
    
    // 값이 비어있거나 변경되지 않았으면 업데이트 안 함
    const currentValue = task.properties?.[field]?.rich_text?.[0]?.plain_text || '';
    if (value === currentValue) return;
    
    dispatch({ type: 'START_UPDATE' });
    
    try {
      const properties = {
        [field]: {
          rich_text: [
            {
              type: 'text',
              text: { content: value }
            }
          ]
        }
      };
      
      await updateNotionPage(task.id, properties);
      
      // 데이터 다시 로드
      setTimeout(() => {
        dispatch({ type: 'UPDATE_SUCCESS' });
        command(dispatch);
      }, 500);
    } catch (error) {
      alert('시간 업데이트 실패: ' + error.message);
      dispatch({ type: 'ERROR', error: error.message });
    }
  };

  // 별 집중도 업데이트
  const handleRatingUpdate = async (task, rating, e) => {
    e.preventDefault();
    
    dispatch({ type: 'START_UPDATE' });
    
    try {
      const properties = {
        '(੭•̀ᴗ•̀)੭': {
          select: {
            name: rating
          }
        }
      };
      
      await updateNotionPage(task.id, properties);
      
      // 데이터 다시 로드
      setTimeout(() => {
        dispatch({ type: 'UPDATE_SUCCESS' });
        command(dispatch);
      }, 500);
    } catch (error) {
      alert('집중도 업데이트 실패: ' + error.message);
      dispatch({ type: 'ERROR', error: error.message });
    }
  };

  return (
    <div>
      {/* 헤더 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: '1px solid #e5e5e7'
      }}>
        <h2 style={{
          margin: 0,
          fontSize: '18px',
          fontWeight: '600',
          color: '#1d1d1f'
        }}>
          📚 PLANNER
        </h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {updating && (
            <span style={{ fontSize: '10px', color: '#999' }}>⏳</span>
          )}
          <button
            onClick={handleToggleView}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '12px',
              color: '#007AFF',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '6px',
              transition: 'background 0.2s'
            }}
          >
            {viewMode === 'timeline' ? '📋 TASK' : '⏰ TIME TABLE'}
          </button>
        </div>
      </div>

      {/* 타임테이블 뷰 */}
      {viewMode === 'timeline' && (
        <div>
          <h3 style={{
            margin: '0 0 12px 0',
            fontSize: '14px',
            fontWeight: '600',
            color: '#666'
          }}>
            오늘 일정 ({todayTasks.length}개)
          </h3>
          {todayTasks.length === 0 ? (
            <p style={{ color: '#999', fontSize: '12px', margin: '20px 0' }}>
              오늘 일정이 없습니다.
            </p>
          ) : (
            <div>
              {todayTasks.map(task => {
                const title = task.properties?.['범위']?.title?.[0]?.plain_text || '제목 없음';
                const start = task.properties?.['시작']?.rich_text?.[0]?.plain_text || '';
                const end = task.properties?.['끝']?.rich_text?.[0]?.plain_text || '';
                const completed = task.properties?.['완료']?.checkbox;
                const rating = task.properties?.['(੭•̀ᴗ•̀)੭']?.select?.name || '';

                return (
                  <div
                    key={task.id}
                    style={{
                      padding: '12px',
                      marginBottom: '8px',
                      backgroundColor: completed ? '#f5f5f7' : '#fff',
                      border: '1px solid #e5e5e7',
                      borderRadius: '10px',
                      opacity: completed ? 0.6 : 1,
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '8px'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '13px',
                          fontWeight: '500',
                          color: '#1d1d1f',
                          textDecoration: completed ? 'line-through' : 'none',
                          marginBottom: '4px'
                        }}>
                          {title}
                        </div>
                        
                        {/* 별 집중도 선택 */}
                        <div style={{
                          display: 'flex',
                          gap: '4px',
                          marginTop: '6px'
                        }}>
                          {['⭐️', '⭐️⭐️', '⭐️⭐️⭐️', '🌟 🌟 🌟'].map((stars) => (
                            <button
                              key={stars}
                              onClick={(e) => handleRatingUpdate(task, stars, e)}
                              disabled={updating}
                              style={{
                                background: rating === stars ? '#FFD700' : '#f5f5f7',
                                border: rating === stars ? '1px solid #FFC700' : '1px solid #e5e5e7',
                                borderRadius: '4px',
                                padding: '2px 6px',
                                cursor: updating ? 'wait' : 'pointer',
                                fontSize: '10px',
                                transition: 'all 0.2s',
                                opacity: rating === stars ? 1 : 0.6
                              }}
                            >
                              {stars}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* 체크박스 */}
                      <button
                        onClick={(e) => handleToggleComplete(task, e)}
                        disabled={updating}
                        style={{
                          background: completed ? '#34C759' : '#fff',
                          border: completed ? 'none' : '2px solid #d1d1d6',
                          borderRadius: '6px',
                          width: '24px',
                          height: '24px',
                          cursor: updating ? 'wait' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          color: '#fff',
                          transition: 'all 0.2s',
                          flexShrink: 0
                        }}
                      >
                        {completed ? '✓' : ''}
                      </button>
                    </div>

                    {/* 시간 입력 */}
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'center'
                    }}>
                      <span style={{ fontSize: '11px', color: '#86868b' }}>⏰</span>
                      <input
                        type="text"
                        defaultValue={start}
                        onBlur={(e) => handleTimeUpdate(task, '시작', e.target.value, e)}
                        disabled={updating}
                        placeholder="00:00"
                        style={{
                          width: '50px',
                          padding: '4px 6px',
                          border: '1px solid #e5e5e7',
                          borderRadius: '4px',
                          fontSize: '11px',
                          textAlign: 'center',
                          background: updating ? '#f5f5f7' : '#fff',
                          cursor: updating ? 'wait' : 'text'
                        }}
                      />
                      <span style={{ fontSize: '11px', color: '#86868b' }}>-</span>
                      <input
                        type="text"
                        defaultValue={end}
                        onBlur={(e) => handleTimeUpdate(task, '끝', e.target.value, e)}
                        disabled={updating}
                        placeholder="00:00"
                        style={{
                          width: '50px',
                          padding: '4px 6px',
                          border: '1px solid #e5e5e7',
                          borderRadius: '4px',
                          fontSize: '11px',
                          textAlign: 'center',
                          background: updating ? '#f5f5f7' : '#fff',
                          cursor: updating ? 'wait' : 'text'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 태스크 뷰 */}
      {viewMode === 'task' && (
        <div>
          <h3 style={{
            margin: '0 0 12px 0',
            fontSize: '14px',
            fontWeight: '600',
            color: '#666'
          }}>
            미완료 태스크 ({incompleteTasks.length}개)
          </h3>
          {incompleteTasks.length === 0 ? (
            <p style={{ color: '#999', fontSize: '12px', margin: '20px 0' }}>
              🎉 모든 태스크 완료!
            </p>
          ) : (
            <div>
              {incompleteTasks.slice(0, 8).map(task => {
                const title = task.properties?.['범위']?.title?.[0]?.plain_text || '제목 없음';
                const priority = task.properties?.['우선순위']?.select?.name;
                const targetTime = task.properties?.['목표 시간']?.number;
                const dateStart = task.properties?.['날짜']?.date?.start;
                const completed = task.properties?.['완료']?.checkbox;

                return (
                  <div
                    key={task.id}
                    style={{
                      padding: '10px 12px',
                      marginBottom: '6px',
                      backgroundColor: '#fff',
                      border: '1px solid #e5e5e7',
                      borderRadius: '8px',
                      borderLeft: `3px solid ${getPriorityColor(priority)}`,
                      transition: 'all 0.2s',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: '500',
                        color: '#1d1d1f',
                        marginBottom: '2px'
                      }}>
                        {title}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: '#86868b',
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center'
                      }}>
                        {priority && (
                          <span style={{
                            backgroundColor: getPriorityColor(priority),
                            color: '#fff',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '10px'
                          }}>
                            {priority}
                          </span>
                        )}
                        {targetTime && <span>⏱ {targetTime}분</span>}
                        {dateStart && <span>📅 {formatDate(dateStart)}</span>}
                      </div>
                    </div>
                    
                    {/* 체크박스 */}
                    <button
                      onClick={(e) => handleToggleComplete(task, e)}
                      disabled={updating}
                      style={{
                        background: completed ? '#34C759' : '#fff',
                        border: completed ? 'none' : '2px solid #d1d1d6',
                        borderRadius: '6px',
                        width: '22px',
                        height: '22px',
                        cursor: updating ? 'wait' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        color: '#fff',
                        transition: 'all 0.2s',
                        flexShrink: 0,
                        marginLeft: '8px'
                      }}
                    >
                      {completed ? '✓' : ''}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 푸터 */}
      <div style={{
        marginTop: '16px',
        paddingTop: '12px',
        borderTop: '1px solid #e5e5e7',
        fontSize: '11px',
        color: '#86868b',
        textAlign: 'center'
      }}>
        마지막 업데이트: {new Date().toLocaleTimeString('ko-KR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </div>
    </div>
  );
};
