const STORAGE_KEY = 'university_app_data_v1';

// Схема структур даних та конфігурація полів
const entitySchemas = {
    teachers: {
        title: "Викладача",
        fields: [
            { key: "id", label: "ID", type: "id", editable: false },
            { key: "fullName", label: "ПІБ", type: "text", editable: true, required: true },
            { key: "department", label: "Кафедра", type: "text", editable: true, required: true },
            { key: "position", label: "Посада", type: "text", editable: true, required: true },
            { key: "disciplines", label: "Дисципліни", type: "text", editable: true, required: true },
            { key: "experience", label: "Стаж (р.)", type: "number", editable: true, min: 0, required: true },
            { key: "degree", label: "Науковий ступінь", type: "text", editable: true, required: true },
            { key: "email", label: "Email", type: "email", editable: true, required: true }
        ]
    },
    students: {
        title: "Студента",
        fields: [
            { key: "id", label: "ID", type: "id", editable: false },
            { key: "fullName", label: "ПІБ", type: "text", editable: true, required: true },
            { key: "group", label: "Група", type: "text", editable: true, required: true },
            { key: "specialty", label: "Спеціальність", type: "text", editable: true, required: true },
            { key: "course", label: "Курс", type: "number", editable: true, min: 1, max: 6, required: true },
            { key: "avgGrade", label: "Середній бал", type: "number", editable: true, step: "0.1", min: 0, max: 100, required: true },
            { key: "studyForm", label: "Форма навчання", type: "select", editable: true, options: ["Денна", "Заочна"], required: true },
            { key: "email", label: "Email", type: "email", editable: true, required: true }
        ]
    },
    disciplines: {
        title: "Дисципліну",
        fields: [
            { key: "id", label: "ID", type: "id", editable: false },
            { key: "name", label: "Назва дисципліни", type: "text", editable: true, required: true },
            { key: "credits", label: "Кредити ECTS", type: "number", editable: true, min: 1, required: true },
            { key: "semester", label: "Семестр", type: "number", editable: true, min: 1, max: 12, required: true },
            { key: "department", label: "Кафедра", type: "text", editable: true, required: true },
            // Вказуємо тип 'ref': вибір лектора реалізовано виключно через <select>, де дані динамічно завантажуються з таблиці teachers
            { key: "lecturerId", label: "Лектор", type: "ref", editable: true, targetEntity: "teachers", refKey: "fullName", required: true },
            { key: "hours", label: "Годин", type: "number", editable: true, min: 10, required: true },
            { key: "controlType", label: "Форма контролю", type: "select", editable: true, options: ["Екзамен", "Залік", "Диф. залік"], required: true }
        ]
    }
};

// Початкові базові дані (ініціалізуються при першому вході)
const initialUniversityData = {
    teachers: [
        {
            id: 1,
            fullName: "Столяренко Тетяна Леонідівна",
            department: "Інтелектуальних систем управління",
            position: "Доцент",
            disciplines: "Об'єктно-орієнтоване програмування, Python",
            experience: 12,
            degree: "Кандидат пед. наук",
            email: "t.stoliarenko@hneu.edu.ua"
        },
        {
            id: 2,
            fullName: "Коваленко Іван Петрович",
            department: "Економічної кібернетики",
            position: "Професор",
            disciplines: "Економетрика, Бази даних",
            experience: 20,
            degree: "Доктор екон. наук",
            email: "i.kovalenko@hneu.edu.ua"
        }
    ],
    students: [
        {
            id: 1,
            fullName: "Петренко Андрій Дмитрович",
            group: "КН-21",
            specialty: "Комп'ютерні науки",
            course: 3,
            avgGrade: 91.5,
            studyForm: "Денна",
            email: "andrii.petrenko@student.ua"
        }
    ],
    disciplines: [
        {
            id: 1,
            name: "Об'єктно-орієнтоване програмування",
            credits: 5,
            semester: 3,
            department: "Інтелектуальних систем управління",
            lecturerId: 1,
            hours: 150,
            controlType: "Екзамен"
        },
        {
            id: 2,
            name: "Економетрика",
            credits: 4,
            semester: 4,
            department: "Економічної кібернетики",
            lecturerId: 2,
            hours: 120,
            controlType: "Залік"
        }
    ]
};

let universityData = {};
let currentTab = "teachers";
let nextId = Date.now();

// ---------------------------------------------------------
// 1. УПРАВЛІННЯ LOCALSTORAGE ТА СИНХРОНІЗАЦІЄЮ МІЖ ВКЛАДКАМИ
// ---------------------------------------------------------
function loadData() {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
        try {
            universityData = JSON.parse(storedData);
        } catch (e) {
            console.error("Помилка читання localStorage, відновлено початкові дані", e);
            universityData = JSON.parse(JSON.stringify(initialUniversityData));
            saveData();
        }
    } else {
        universityData = JSON.parse(JSON.stringify(initialUniversityData));
        saveData();
    }
}

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(universityData));
}

// Автоматична синхронізація між відкритими вкладками браузера
function setupStorageSync() {
    window.addEventListener('storage', (event) => {
        if (event.key === STORAGE_KEY) {
            loadData();
            renderTables();
        }
    });
}

// ---------------------------------------------------------
// 2. РЕНДЕРИНГ ТАБЛИЦЬ
// ---------------------------------------------------------
function getTeacherNameById(id) {
    const teacher = universityData.teachers.find(t => t.id === Number(id));
    return teacher ? teacher.fullName : "Непризначено";
}

function renderTables() {
    // 1. Викладачі
    const teachersTbody = document.getElementById('teachers-tbody');
    teachersTbody.innerHTML = universityData.teachers.map(item => `
        <tr data-entity="teachers" data-id="${item.id}">
            <td class="editable" data-key="fullName">${item.fullName}</td>
            <td class="editable" data-key="department">${item.department}</td>
            <td class="editable" data-key="position">${item.position}</td>
            <td class="editable" data-key="disciplines">${item.disciplines}</td>
            <td class="editable" data-key="experience">${item.experience}</td>
            <td class="editable" data-key="degree">${item.degree}</td>
            <td class="editable" data-key="email">${item.email}</td>
            <td>
                <button class="delete-btn" title="Видалити рядок" onclick="deleteRecord('teachers', ${item.id})">❌</button>
            </td>
        </tr>
    `).join('');

    // 2. Студенти
    const studentsTbody = document.getElementById('students-tbody');
    studentsTbody.innerHTML = universityData.students.map(item => `
        <tr data-entity="students" data-id="${item.id}">
            <td class="editable" data-key="fullName">${item.fullName}</td>
            <td class="editable" data-key="group">${item.group}</td>
            <td class="editable" data-key="specialty">${item.specialty}</td>
            <td class="editable" data-key="course">${item.course}</td>
            <td class="editable" data-key="avgGrade">${item.avgGrade}</td>
            <td class="editable" data-key="studyForm">${item.studyForm}</td>
            <td class="editable" data-key="email">${item.email}</td>
            <td>
                <button class="delete-btn" title="Видалити рядок" onclick="deleteRecord('students', ${item.id})">❌</button>
            </td>
        </tr>
    `).join('');

    // 3. Дисципліни
    const disciplinesTbody = document.getElementById('disciplines-tbody');
    disciplinesTbody.innerHTML = universityData.disciplines.map(item => `
        <tr data-entity="disciplines" data-id="${item.id}">
            <td class="editable" data-key="name">${item.name}</td>
            <td class="editable" data-key="credits">${item.credits}</td>
            <td class="editable" data-key="semester">${item.semester}</td>
            <td class="editable" data-key="department">${item.department}</td>
            <td class="editable" data-key="lecturerId">${getTeacherNameById(item.lecturerId)}</td>
            <td class="editable" data-key="hours">${item.hours}</td>
            <td class="editable" data-key="controlType">${item.controlType}</td>
            <td>
                <button class="delete-btn" title="Видалити рядок" onclick="deleteRecord('disciplines', ${item.id})">❌</button>
            </td>
        </tr>
    `).join('');

    attachInlineEditEvents();
}

// ---------------------------------------------------------
// 3. ВИДАЛЕННЯ З ПЕРЕВІРКОЮ ЗВ'ЯЗКІВ
// ---------------------------------------------------------
function deleteRecord(entityKey, id) {
    if (entityKey === 'teachers') {
        const teacher = universityData.teachers.find(t => t.id === id);
        const relatedDisciplines = universityData.disciplines.filter(d => d.lecturerId === id);

        if (relatedDisciplines.length > 0) {
            const disciplineNames = relatedDisciplines.map(d => `«${d.name}»`).join(', ');
            showErrorModal(
                `Неможливо видалити викладача <strong>${teacher ? teacher.fullName : ''}</strong>, ` +
                `оскільки він прив'язаний до дисциплін: <strong>${disciplineNames}</strong>.`
            );
            return;
        }
    }

    universityData[entityKey] = universityData[entityKey].filter(item => item.id !== id);
    saveData();
    renderTables();
}

function showErrorModal(message) {
    const errorOverlay = document.getElementById('error-modal-overlay');
    const errorMessage = document.getElementById('error-modal-message');
    errorMessage.innerHTML = message;
    errorOverlay.classList.add('active');
}

function setupErrorModal() {
    const errorOverlay = document.getElementById('error-modal-overlay');
    const closeBtn = document.getElementById('close-error-btn');
    const okBtn = document.getElementById('error-ok-btn');

    const close = () => errorOverlay.classList.remove('active');
    closeBtn.addEventListener('click', close);
    okBtn.addEventListener('click', close);
    errorOverlay.addEventListener('click', (e) => {
        if (e.target === errorOverlay) close();
    });
}

// ---------------------------------------------------------
// 4. INLINE (IN-PLACE) РЕДАГУВАННЯ З ПІДТРИМКОЮ РЕФЕРЕНСНИХ СПИСКІВ
// ---------------------------------------------------------
function attachInlineEditEvents() {
    const editableCells = document.querySelectorAll('td.editable');

    editableCells.forEach(cell => {
        cell.addEventListener('click', function () {
            if (this.classList.contains('editing')) return;

            const tr = this.closest('tr');
            const entityKey = tr.getAttribute('data-entity');
            const recordId = Number(tr.getAttribute('data-id'));
            const fieldKey = this.getAttribute('data-key');

            const record = universityData[entityKey].find(r => r.id === recordId);
            if (!record) return;

            const schema = entitySchemas[entityKey];
            const fieldConfig = schema.fields.find(f => f.key === fieldKey);

            this.classList.add('editing');
            const originalValue = record[fieldKey];

            let inputElement;

            if (fieldConfig && fieldConfig.type === 'select') {
                inputElement = document.createElement('select');
                inputElement.className = 'inline-input';
                fieldConfig.options.forEach(opt => {
                    const option = document.createElement('option');
                    option.value = opt;
                    option.textContent = opt;
                    if (opt === originalValue) option.selected = true;
                    inputElement.appendChild(option);
                });
            } else if (fieldConfig && fieldConfig.type === 'ref') {
                // ПРИВ'ЯЗКА У ВИГЛЯДІ СПИСКУ В ІНЛАЙН РЕДАГУВАННІ
                inputElement = document.createElement('select');
                inputElement.className = 'inline-input';
                
                if (universityData.teachers.length === 0) {
                    const option = document.createElement('option');
                    option.value = "";
                    option.textContent = "Немає доступних викладачів";
                    inputElement.appendChild(option);
                } else {
                    universityData.teachers.forEach(t => {
                        const option = document.createElement('option');
                        option.value = t.id;
                        option.textContent = t.fullName;
                        if (t.id === Number(originalValue)) option.selected = true;
                        inputElement.appendChild(option);
                    });
                }
            } else {
                inputElement = document.createElement('input');
                inputElement.className = 'inline-input';
                inputElement.type = fieldConfig ? (fieldConfig.type === 'number' ? 'number' : 'text') : 'text';
                inputElement.value = originalValue;
            }

            this.innerHTML = '';
            this.appendChild(inputElement);
            inputElement.focus();

            const saveEdit = () => {
                let newValue = inputElement.value;

                if (!newValue && fieldConfig.type === 'ref') {
                    renderTables();
                    return;
                }

                if (fieldConfig.type === 'number' || fieldConfig.type === 'ref') {
                    newValue = Number(newValue);
                }

                record[fieldKey] = newValue;
                saveData();
                renderTables();
            };

            inputElement.addEventListener('blur', saveEdit);
            inputElement.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    inputElement.removeEventListener('blur', saveEdit);
                    saveEdit();
                } else if (e.key === 'Escape') {
                    inputElement.removeEventListener('blur', saveEdit);
                    renderTables();
                }
            });
        });
    });
}

// ---------------------------------------------------------
// 5. ФОРМА ДОДАВАННЯ ТА ВИПАДНІ СПИСКИ (REF / LOOKUP)
// ---------------------------------------------------------
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));

            button.classList.add('active');
            currentTab = button.getAttribute('data-target');
            document.getElementById(currentTab).classList.add('active');
        });
    });
}

function generateFormFields(entityKey) {
    const container = document.getElementById('form-fields-container');
    const schema = entitySchemas[entityKey];
    
    document.getElementById('modal-title').textContent = `Додати ${schema.title}`;
    container.innerHTML = '';

    schema.fields.forEach(field => {
        if (field.type === 'id') return;

        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';

        const label = document.createElement('label');
        label.textContent = field.label;
        formGroup.appendChild(label);

        if (field.type === 'select') {
            const select = document.createElement('select');
            select.name = field.key;
            select.required = field.required;

            field.options.forEach(optionText => {
                const option = document.createElement('option');
                option.value = optionText;
                option.textContent = optionText;
                select.appendChild(option);
            });
            formGroup.appendChild(select);
        } else if (field.type === 'ref') {
            // ПРИВ'ЯЗКА У ВИГЛЯДІ СПИСКУ ДЛЯ НОВОГО ЗАПИСУ
            const select = document.createElement('select');
            select.name = field.key;
            select.required = field.required;

            const targetData = universityData[field.targetEntity] || [];

            if (targetData.length === 0) {
                const option = document.createElement('option');
                option.value = "";
                option.textContent = "-- Спочатку додайте викладача в першу таблицю --";
                select.appendChild(option);
            } else {
                targetData.forEach(item => {
                    const option = document.createElement('option');
                    option.value = item.id;
                    option.textContent = item[field.refKey];
                    select.appendChild(option);
                });
            }

            formGroup.appendChild(select);
        } else {
            const input = document.createElement('input');
            input.type = field.type;
            input.name = field.key;
            input.required = field.required;
            if (field.min !== undefined) input.min = field.min;
            if (field.max !== undefined) input.max = field.max;
            if (field.step !== undefined) input.step = field.step;
            
            formGroup.appendChild(input);
        }

        container.appendChild(formGroup);
    });
}

function setupModal() {
    const modalOverlay = document.getElementById('modal-overlay');
    const openBtn = document.getElementById('open-modal-btn');
    const closeBtn = document.getElementById('close-modal-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const form = document.getElementById('add-data-form');

    const openModal = () => {
        generateFormFields(currentTab);
        modalOverlay.classList.add('active');
    };

    const closeModal = () => {
        modalOverlay.classList.remove('active');
        form.reset();
    };

    openBtn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const newEntry = { id: ++nextId };

        entitySchemas[currentTab].fields.forEach(field => {
            if (field.type === 'id') return;
            let val = formData.get(field.key);
            if (field.type === 'number' || field.type === 'ref') {
                val = Number(val);
            }
            newEntry[field.key] = val;
        });

        universityData[currentTab].push(newEntry);
        saveData();
        renderTables();
        closeModal();
    });
}

function setupResetButton() {
    const resetBtn = document.getElementById('reset-storage-btn');
    resetBtn.addEventListener('click', () => {
        if (confirm("Ви дійсно бажаєте скинути всі дані до початкових?")) {
            localStorage.removeItem(STORAGE_KEY);
            loadData();
            renderTables();
        }
    });
}

// ---------------------------------------------------------
// 6. ІНІЦІАЛІЗАЦІЯ
// ---------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    renderTables();
    setupTabs();
    setupModal();
    setupErrorModal();
    setupStorageSync();
    setupResetButton();
});