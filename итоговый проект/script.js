// const — объявление неизменяемой переменной (константы).
// baseUrl — базовый URL-адрес сервера (API). Вынесен в отдельную переменную, чтобы не дублировать его в каждом запросе и легко поменять при переносе сайта на другой домен.
const baseUrl = "http://kino.vippo.ru/api";

// let — объявление переменной, значение которой будет меняться во время работы сайта.
// currentPostId — хранит ID (уникальный номер) поста, который пользователь открыл прямо сейчас. Изначально null (пусто). Нужна, чтобы функция отправки комментария знала, к какому именно посту прикрепить текст.
let currentPostId = null;

// =========================================================================
// ФУНКЦИЯ ПЕРЕКЛЮЧЕНИЯ СТРАНИЦ (Реализация SPA — одностраничного приложения)
// =========================================================================
// page — параметр (аргумент), в который передается строковое название ID блока, который нужно показать (например, 'indexPage').
function openPage(page) {
    // Создаем массив (список) из ID всех HTML-блоков, которые выполняют роль отдельных страниц на сайте.
    const pagesToHide = [
        "indexPage",      // Главная страница
        "registerPage",   // Страница регистрации
        "loginPage",      // Страница входа
        "postPage",       // Страница чтения одного поста
        "createPostPage", // Страница создания поста
        "profilePage",    // Личный кабинет (профиль)
    ];

    // Метод .forEach() запускает цикл: он берет каждый элемент из массива pagesToHide по очереди и кладет его в переменную pageId.
    pagesToHide.forEach((pageId) => {
        // document.querySelector() — метод поиска элемента в HTML-документе по CSS-селектору.
        // `#${pageId}` — шаблонная строка (обратные кавычки), которая подставляет значение переменной pageId после решетки # (поиск по ID, например #indexPage).
        const el = document.querySelector(`#${pageId}`);
        
        // Проверяем: если такой HTML-элемент действительно найден на странице (el не равен null)...
        if (el) {
            // el.style.display — обращение к CSS-свойству display элемента для управления его видимостью.
            // (pageId !== page) ? 'none' : '' — тернарный оператор (сокращенный if-else).
            // Перевод: "Если ID проверяемого блока НЕ совпадает с тем, который мы хотим открыть (page), задаем ему display: 'none' (прячем). Если совпадает — задаем пустую строку '' (возвращаем стандартную видимость)".
            el.style.display = (pageId !== page) ? 'none' : '';
        }
    });

    // Дополнительная логика при открытии конкретных страниц:
    // Оператор === означает строгое сравнение (совпадает и значение, и тип данных).
    if (page === 'indexPage') {
        loadPosts(); // Если открыли главную — сразу запускаем загрузку всех постов с сервера.
    } else if (page === 'profilePage') {
        profile();   // Если открыли профиль — сразу загружаем данные личного кабинета и посты текущего пользователя.
    }
}

// =========================================================================
// ФУНКЦИЯ ЗАГРУЗКИ ГЛАВНОЙ СТРАНИЦЫ (Список всех постов)
// =========================================================================
// Ключевое слово async делает функцию асинхронной. Это позволяет использовать внутри неё слово await (ожидание ответа от сервера без зависания браузера).
async function loadPosts() {
    // Склеиваем базовый адрес сервера и конкретный маршрут (эндпоинт) '/post'. Операция называется "конкатенация строк".
    // В итоге переменная url хранит строку: "http://kino.vippo.ru/api/post"
    const url = baseUrl + '/post';
    
    // Объект настроек для сетевого запроса.
    // method: 'GET' — HTTP-метод, который означает, что мы хотим только ПОЛУЧИТЬ данные с сервера, ничего не меняя на нём.
    const options = { method: 'GET' };

    // Конструкция try ... catch используется для перехвата ошибок (например, если пропал интернет или упал сервер), чтобы код не "сломался" полностью.
    try {
        // fetch(url, options) — встроенный метод браузера для отправки сетевых запросов (AJAX).
        // await заставляет JavaScript подождать на этой строчке, пока сервер не пришлет ответ, и только потом записать его в переменную response.
        const response = await fetch(url, options);
        
        // response.json() — метод, который распаковывает ответ сервера из текстового формата JSON в полноценный JavaScript-массив с объектами. Тоже требует await, так как чтение потока данных занимает время.
        const data = await response.json();

        // Ищем внутри блока #indexPage тег div с классом row (сетка Bootstrap, куда будут складываться карточки постов).
        const row = document.querySelector('#indexPage div.row');
        // Защита от ошибки: если такой контейнер в HTML не найден, немедленно выходим из функции (return).
        if (!row) return;
        // Очищаем внутреннее HTML-содержимое контейнера, чтобы старые карточки удалились перед отрисовкой новых (избегаем дублирования).
        row.innerHTML = "";

        // Перебираем массив полученных с сервера постов (data). Каждый отдельный объект поста попадает в переменную post.
        data.forEach(post => {
            // document.createElement('div') — создает в памяти браузера новый пустой HTML-тег <div> (пока он не виден на странице).
            const postElement = document.createElement('div');
            // .classList.add() — добавляет CSS-классы к созданному div (это классы адаптивной сетки Bootstrap: 1 колонка на телефонах, 4 колонки на больших экранах).
            postElement.classList.add('col-12', 'col-sm-6', 'col-md-4', 'col-lg-3', 'mb-4');

            // .innerHTML — записывает внутрь созданного div готовую HTML-разметку карточки.
            // Конструкция ${...} внутри обратных кавычек (шаблонная строка) позволяет встраивать значения переменных прямо в HTML.
            // Оператор || (логическое ИЛИ) работает как запасной вариант: если у поста нет картинки (post.image), подставится пустая строка ''; если нет имени автора (post.user), напишется слово 'Автор'.
            // В атрибуте onclick="event.preventDefault(); loadPost(${post.id})": event.preventDefault() отменяет стандартный переход по ссылке (#), а loadPost(${post.id}) запускает открытие этого конкретного поста по его ID.
            postElement.innerHTML = `
                <div class="card h-100">
                    <img src="${post.image || ''}" class="card-img-top" alt="${post.name || ''}" style="height: 180px; object-fit: cover;">
                    <div class="card-body d-flex flex-column">
                        <div class="badge bg-success mb-3 align-self-start">${post.user || 'Автор'}</div>
                        <h5 class="card-title">${post.name}</h5>
                        <p class="card-text text-truncate">${post.text}</p>
                        <a href="#" class="btn btn-primary mt-auto" onclick="event.preventDefault(); loadPost(${post.id})">Читать пост</a>
                    </div>
                </div>
            `;
            // .appendChild() — физически вставляет сформированную карточку postElement в конец контейнера row на реальной странице.
            row.appendChild(postElement);
        });
    } catch (error) {
        // Если в блоке try произошла любая ошибка, управление передается сюда. console.error выводит красный текст ошибки в консоль разработчика (F12).
        console.error('Ошибка загрузки постов:', error);
    }
}

// =========================================================================
// ФУНКЦИЯ ЗАГРУЗКИ ОДНОГО ПОСТА И ЕГО КОММЕНТАРИЕВ
// =========================================================================
// postId — принимает ID поста, на который кликнул пользователь.
async function loadPost(postId) {
    // Склеиваем адрес: базовый URL + '/post/' + номер конкретного поста (например, "http://kino.vippo.ru/api/post/12").
    const url = baseUrl + '/post/' + postId;
    const options = { method: 'GET' };

    try {
        const response = await fetch(url, options);
        // Получаем объект с подробными данными одного поста (заголовок, полный текст, картинка и массив комментариев).
        const data = await response.json();
        // Запоминаем ID этого поста в глобальную переменную currentPostId, чтобы пользователь мог отправить к нему комментарий.
        currentPostId = postId;

        // Находим на странице скрытый контейнер #postPage, куда будем загружать детали поста.
        const postPage = document.querySelector('#postPage');
        // Создаем пустую строковую переменную, в которую будем накапливать HTML-код всех комментариев.
        let commentsHtml = '';

        // Проверяем два условия одновременно (оператор && — логическое И):
        // 1. Существует ли вообще поле data.comments (не null и не undefined).
        // 2. Длина массива комментариев (data.comments.length) больше 0.
        if (data.comments && data.comments.length > 0) {
            // Перебираем каждый комментарий в массиве.
            data.comments.forEach(comment => {
                // Оператор += означает "прибавить к уже существующей строке" (дописываем каждую новую карточку комментария в конец переменной commentsHtml).
                // new Date(comment.created_at).toLocaleString() — преобразует техническую дату с сервера в привычный для человека формат (например, "18.11.2026, 23:40:00").
                commentsHtml += `
                    <div class="card mb-3">
                        <div class="card-body">
                            <div class="d-flex justify-content-between">
                                <h5 class="card-title">${comment.user || 'Аноним'}</h5>
                                <small class="text-muted">${comment.created_at ? new Date(comment.created_at).toLocaleString() : ''}</small>
                            </div>
                            <p class="card-text">${comment.text || ''}</p>
                        </div>
                    </div>
                `;
            });
        } else {
            // Если массив комментариев пуст, записываем в переменную текст-заглушку.
            commentsHtml = '<p class="text-muted">Комментариев пока нет. Будьте первым!</p>';
        }

        // Полностью перезаписываем HTML-код внутри страницы поста: добавляем кнопку возврата, заголовок, картинку, текст, форму добавления комментария и накопленный список комментариев (${commentsHtml}).
        postPage.innerHTML = `
            <button class="btn btn-secondary mb-4" onclick="openPage('indexPage')">← Назад к постам</button>
            <h2 class="mb-4">${data.name}</h2>
            <img src="${data.image || ''}" alt="${data.name}" class="img-fluid mb-4 rounded" style="max-height: 400px;">
            <p class="fs-5">${data.text}</p>
            
            <h4 class="mt-4">Комментарии (${data.comments ? data.comments.length : 0})</h4>
            
            <form class="mb-4" onsubmit="event.preventDefault(); sendMyComment()">
                <div class="mb-3">
                    <textarea rows="3" class="form-control" id="commentText" placeholder="Введите комментарий" required></textarea>
                </div>
                <button type="submit" class="btn btn-success">Отправить</button>
            </form>

            <div class="comments">
                ${commentsHtml}
            </div>
        `;

        // Вызываем функцию переключения страниц, чтобы скрыть главную страницу и показать заполненную страницу поста.
        openPage('postPage');
    } catch (error) {
        console.error('Ошибка загрузки поста:', error);
    }
}

// =========================================================================
// ФУНКЦИЯ ОТПРАВКИ КОММЕНТАРИЯ
// =========================================================================
async function sendMyComment() {
    // Находим поле ввода <textarea id="commentText"> и через свойство .value забираем текст, который напечатал пользователь.
    const text = document.querySelector('#commentText').value;
    // Формируем адрес для отправки комментария с помощью шаблонной строки, подставляя сохранённый ID открытого поста.
    const url = baseUrl + `/post/${currentPostId}/comment`;
    
    // Настройки запроса на отправку данных:
    const options = {
        method: 'POST', // POST — HTTP-метод для ОТПРАВКИ и создания новых данных на сервере.
        headers: {      // Служебные заголовки запроса:
            'Content-Type': 'application/json', // Сообщаем серверу, что данные в теле запроса отправляются в формате JSON.
            // Достаем из памяти браузера (localStorage) токен авторизации и передаем его по стандарту Bearer, чтобы сервер знал, от чьего имени пишется комментарий.
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        // body — "тело" (посылка) запроса. Упаковываем текст комментария в JSON-строку.
        body: `{"text": "${text}"}`
    };

    try {
        const response = await fetch(url, options);
        // response.ok возвращает true, если сервер ответил успешным HTTP-статусом (от 200 до 299).
        if (response.ok) {
            // Заново загружаем текущий пост, чтобы новый комментарий сразу появился в списке на экране.
            loadPost(currentPostId);
        } else {
            // Если сервер ответил ошибкой (например, 401 Unauthorized — не авторизован), показываем всплывающее окно alert.
            alert('Не удалось отправить комментарий. Возможно, нужно войти в систему.');
        }
    } catch (error) {
        console.error('Ошибка:', error);
    }
}

// =========================================================================
// ФУНКЦИЯ РЕГИСТРАЦИИ ПОЛЬЗОВАТЕЛЯ
// =========================================================================
async function register() {
    // Считываем значения (.value) из трех полей ввода (input) на странице регистрации.
    const name = document.querySelector('#registerName').value;
    const login = document.querySelector('#registerLogin').value;
    const password = document.querySelector('#registerPassword').value;

    const url = baseUrl + '/register';
    const options = {
        method: 'POST', // Отправляем данные нового пользователя на сервер.
        headers: { 'Content-Type': 'application/json' },
        // Формируем JSON-строку со всеми тремя полями для отправки.
        body: `{"name":"${name}","login":"${login}","password":"${password}"}`
    };

    try {
        const response = await fetch(url, options);
        if (response.ok) {
            alert('Регистрация успешна! Теперь войдите в систему.');
            // Автоматически переключаем пользователя на страницу авторизации (входа).
            openPage('loginPage');
        } else {
            // Если сервер отклонил регистрацию (например, такой логин уже занят), читаем текст ошибки от сервера.
            const err = await response.json();
            alert('Ошибка регистрации: ' + (err.message || 'Проверьте данные'));
        }
    } catch (error) {
        console.error('Ошибка:', error);
    }
}

// =========================================================================
// ФУНКЦИЯ ВХОДА В СИСТЕМУ (АВТОРИЗАЦИЯ)
// =========================================================================
async function login() {
    // Получаем введенные логин и пароль из формы входа.
    const loginVal = document.querySelector('#loginLogin').value;
    const passwordVal = document.querySelector('#loginPassword').value;

    const url = baseUrl + '/login';
    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: `{"login": "${loginVal}", "password": "${passwordVal}"}`
    };

    try {
        const response = await fetch(url, options);
        if (response.ok) {
            // Читаем ответ сервера, в котором при успешном входе содержится секретный ключ доступа (токен) и имя пользователя.
            const data = await response.json();
            if (data.token) {
                // localStorage.setItem(ключ, значение) — сохраняет данные в постоянное хранилище браузера.
                // Они не удалятся даже при перезагрузке страницы (F5). Токен нужен для всех дальнейших защищенных действий.
                localStorage.setItem('token', data.token);
                localStorage.setItem('username', data.username);
            }
            alert('Вход выполнен успешно!');
            openPage('profilePage'); // Переходим на страницу личного кабинета.
            profile();               // Вызываем обновление данных профиля.
        } else {
            alert('Ошибка входа! Проверьте логин и пароль.');
        }
    } catch (error) {
        console.error('Ошибка:', error);
    }
}

// =========================================================================
// ФУНКЦИЯ СОЗДАНИЯ НОВОГО ПОСТА (С загрузкой картинки)
// =========================================================================
async function createPost() {
    // Считываем название и текст поста.
    const name = document.querySelector('#createPostName').value;
    const text = document.querySelector('#createPostText').value;
    // Находим поле выбора файла (<input type="file">).
    const imageInput = document.querySelector('#createPostImage');
    // imageInput.files — это список прикрепленных файлов. Берем самый первый файл с индексом [0], если он выбран.
    const image = imageInput ? imageInput.files[0] : null;

    // new FormData() — специальный встроенный объект JavaScript для отправки форм, содержащих файлы (картинки).
    // Обычный JSON умеет передавать только текст, поэтому для картинок обязательно используется FormData.
    const formData = new FormData();
    // Метод .append(ключ, значение) добавляет поля в виртуальную форму.
    formData.append('name', name);
    formData.append('text', text);
    if (image) {
        formData.append('image', image); // Прикрепляем сам файл картинки, если пользователь его выбрал.
    }

    const url = baseUrl + '/post';
    const options = {
        method: 'POST',
        headers: {
            // Внимание: здесь НЕ указывается 'Content-Type': 'application/json', потому что браузер сам автоматически подставит правильный заголовок для отправки файлов (multipart/form-data).
            // Передаем только токен авторизации.
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData // В тело запроса передаем собранный объект FormData.
    };

    try {
        const response = await fetch(url, options);
        if (response.ok) {
            alert('Пост успешно создан!');
            openPage('profilePage'); // Возвращаемся в профиль, где отобразится новый пост.
        } else {
            const err = await response.json();
            alert('Ошибка создания поста: ' + (err.message || 'Проверьте заполнение полей'));
        }
    } catch (error) {
        console.error('Ошибка создания поста:', error);
    }
}

// =========================================================================
// ФУНКЦИЯ УДАЛЕНИЯ ПОСТА ПО ID
// =========================================================================
async function deletePost(postId) {
    // confirm() — встроенное окно браузера с кнопками "ОК" и "Отмена". Возвращает true (ОК) или false (Отмена).
    // Восклицательный знак ! означает логическое "НЕ". Если пользователь нажал "Отмена" (!true -> false), срабатывает return и удаление прерывается.
    if (!confirm('Вы точно хотите удалить этот пост?')) return;

    // Формируем адрес конкретного поста для удаления (например, http://kino.vippo.ru/api/post/5).
    const url = `${baseUrl}/post/${postId}`;
    const options = {
        method: 'DELETE', // DELETE — специальный HTTP-метод для УДАЛЕНИЯ данных на сервере.
        headers: {
            // Передаем токен, чтобы сервер проверил, действительно ли этот пост принадлежит текущему пользователю.
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    };

    try {
        const response = await fetch(url, options);
        if (response.ok) {
            alert('Пост удалён!');
            profile(); // Заново загружаем список постов в профиле, чтобы удаленный пост исчез из таблицы.
        } else {
            alert('Не удалось удалить пост. Возможно, он принадлежит другому пользователю.');
        }
    } catch (error) {
        console.error('Ошибка удаления поста:', error);
    }
}

// =========================================================================
// ФУНКЦИЯ ЗАГРУЗКИ ПРОФИЛЯ И ПОСТОВ ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ
// =========================================================================
async function profile() {
    // Эндпоинт '/my-post' на сервере настроен так, чтобы возвращать посты только того пользователя, чей токен передан в заголовке.
    const url = baseUrl + '/my-post';
    const options = {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    };

    try {
        const response = await fetch(url, options);
        // Получаем массив постов текущего авторизованного пользователя.
        const data = await response.json();

        // Находим заголовок <h2> и таблицу .table внутри страницы профиля.
        const title = document.querySelector('#profilePage h2');
        const table = document.querySelector('#profilePage .table');
        // Достаем имя пользователя из localStorage. Используем запасные варианты на случай разного регистра букв в ключе, а если ничего нет — пишем 'Пользователь'.
        const username = localStorage.getItem('username') || localStorage.getItem('userName') || 'Пользователь';

        if (title) {
            // Подставляем имя пользователя в приветственный заголовок.
            title.innerHTML = `Добро пожаловать, ${username}!`;
        }

        // Формируем HTML-разметку первой строки таблицы (шапку с названиями колонок).
        let rowsHtml = `
            <tr>
                <th>ID</th>
                <th>Название поста</th>
                <th>Дата создания</th>
                <th>Действия</th>
            </tr>
        `;

        // Если сервер вернул непустой массив постов...
        if (data && data.length > 0) {
            // ...для каждого поста генерируем строку таблицы <tr> с четырьмя ячейками <td>.
            // В последнюю ячейку добавляем две кнопки с обработчиками клика onclick: открыть пост и удалить пост.
            data.forEach(post => {
                rowsHtml += `
                    <tr>
                        <td>${post.id}</td>
                        <td>${post.name}</td>
                        <td>${post.created_at ? new Date(post.created_at).toLocaleString() : ''}</td>
                        <td>
                            <button class="btn btn-primary" onclick="loadPost(${post.id})">Перейти к посту</button>
                            <button class="btn btn-danger" onclick="deletePost(${post.id})">Удалить пост</button>
                        </td>
                    </tr>
                `;
            });
        } else {
            // Если постов у пользователя нет, создаем одну строку, объединяющую все 4 колонки (colspan="4"), с текстом-заглушкой.
            rowsHtml += '<tr><td colspan="4" class="text-center text-muted">У вас пока нет созданных постов</td></tr>';
        }

        if (table) {
            // Вставляем всю собранную HTML-разметку строк внутрь таблицы на странице.
            table.innerHTML = rowsHtml;
        }
    } catch (error) {
        console.error('Ошибка загрузки профиля:', error);
    }
}

// =========================================================================
// ФУНКЦИЯ ВЫХОДА ИЗ АККАУНТА (Logout)
// =========================================================================
function logout() {
    // localStorage.removeItem(ключ) — полностью удаляет указанные записи из памяти браузера.
    // Без токена браузер больше не сможет подтверждать личность пользователя при запросах к серверу.
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userName');

    alert('Вы вышли из системы');
    openPage('indexPage'); // Перенаправляем на главную страницу.
}

// =========================================================================
// ТОЧКА ВХОДА: ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ
// =========================================================================
// document.addEventListener('DOMContentLoaded', ...) — "слушатель событий".
// Он ждет, пока браузер полностью прочитает и построит весь HTML-каркас страницы, и только после этого запускает код внутри, чтобы querySelector гарантированно нашел все формы и кнопки.
document.addEventListener('DOMContentLoaded', () => {
    // Находим форму регистрации на странице.
    const regForm = document.querySelector('#registerPage form');
    // Если форма найдена, вешаем на неё перехватчик события 'submit' (отправка формы при нажатии на кнопку или Enter).
    // (e) => { e.preventDefault(); register(); } — стрелочная функция.
    // e.preventDefault() — ОЧЕНЬ ВАЖНЫЙ МЕТОД: по умолчанию HTML-форма при отправке перезагружает всю страницу браузера. Этот метод отменяет перезагрузку, чтобы вместо неё сработала наша асинхронная JS-функция register().
    if (regForm) regForm.addEventListener('submit', (e) => { e.preventDefault(); register(); });

    // То же самое для формы входа: отменяем перезагрузку страницы и вызываем login().
    const logForm = document.querySelector('#loginPage form');
    if (logForm) logForm.addEventListener('submit', (e) => { e.preventDefault(); login(); });

    // То же самое для формы создания поста: отменяем перезагрузку страницы и вызываем createPost().
    const createPostForm = document.querySelector('#createPostPage form');
    if (createPostForm) createPostForm.addEventListener('submit', (e) => { e.preventDefault(); createPost(); });

    // Самое первое действие при открытии сайта пользователем: показываем главную страницу и загружаем посты.
    openPage('indexPage');
});