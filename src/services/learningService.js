import { db } from './firebase';
import { collection, doc, getDoc, getDocs, serverTimestamp, writeBatch } from 'firebase/firestore';

const COURSES_COLLECTION = 'learning_courses';

const COURSE_CATALOG = [
    {
        title: 'Diagnostico Inicial do Cambio Automatico',
        description: 'Curso introdutorio para identificar sintomas, levantar historico do veiculo e preparar um diagnostico seguro antes da troca de fluido.',
        imageUrl: 'https://images.unsplash.com/photo-1517524206127-48bbd363f3d7?auto=format&fit=crop&w=1200&q=80',
        moduleThemes: [
            'Recepcao Tecnica e Checklist',
            'Levantamento de Sintomas',
            'Leitura de Fluido e Contaminacao',
            'Teste de Rodagem e Confirmacao',
            'Registro do Diagnostico',
            'Apresentacao do Orcamento',
            'Encerramento do Atendimento',
        ],
    },
    {
        title: 'Troca de Fluido ATF com Processo Padronizado',
        description: 'Curso focado em padronizar a rotina de troca de ATF, desde a preparacao da bancada ate a conferência final do servico.',
        imageUrl: 'https://images.unsplash.com/photo-1486754735734-325b5831c3ad?auto=format&fit=crop&w=1200&q=80',
        moduleThemes: [
            'Preparacao da Bancada',
            'Selecao Correta do Fluido',
            'Conexao dos Equipamentos',
            'Sequencia da Troca',
            'Controle de Temperatura',
            'Checklist de Qualidade',
            'Entrega Tecnica ao Cliente',
        ],
    },
    {
        title: 'Boas Praticas de Manutencao em Transmissoes Automaticas',
        description: 'Curso de boas praticas para reduzir retrabalho, elevar a qualidade da manutencao e documentar corretamente cada servico executado.',
        imageUrl: 'https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?auto=format&fit=crop&w=1200&q=80',
        moduleThemes: [
            'Organizacao da Ordem de Servico',
            'Padrao de Inspecao Visual',
            'Cuidados com Vedacoes e Conectores',
            'Rotina de Limpeza Tecnica',
            'Rastreabilidade do Servico',
            'Conferencia Final',
            'Pos-venda Tecnico',
        ],
    },
    {
        title: 'Atendimento Consultivo para Servicos de Cambio',
        description: 'Curso para equipes que precisam transformar diagnostico tecnico em atendimento claro, confiante e alinhado com a necessidade do cliente.',
        imageUrl: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80',
        moduleThemes: [
            'Abordagem Inicial do Cliente',
            'Escuta Tecnica e Perguntas-Chave',
            'Explicacao do Diagnostico',
            'Alinhamento de Expectativas',
            'Aprovacao do Servico',
            'Comunicacao Durante a Execucao',
            'Fechamento e Pos-venda',
        ],
    },
    {
        title: 'Controle de Qualidade na Troca de Fluido de Cambio',
        description: 'Curso dedicado a checkpoints de qualidade, validacoes tecnicas e consistencia de processo em servicos de troca de fluido de cambio automatico.',
        imageUrl: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80',
        moduleThemes: [
            'Criterios de Qualidade na Entrada',
            'Validacao de Componentes',
            'Padrao de Execucao',
            'Controle de Variaveis Criticas',
            'Teste Funcional',
            'Auditoria Interna do Servico',
            'Liberacao do Veiculo',
        ],
    },
    {
        title: 'Fluxo Completo de Oficina para Cambio Automatico',
        description: 'Curso abrangente que conecta recepcao, diagnostico, troca de fluido, controle de qualidade e entrega em um unico fluxo operacional.',
        imageUrl: 'https://images.unsplash.com/photo-1516321310764-8f3bdc1b3c7f?auto=format&fit=crop&w=1200&q=80',
        moduleThemes: [
            'Entrada do Veiculo na Oficina',
            'Triagem Tecnica Inicial',
            'Planejamento da Execucao',
            'Execucao da Troca de Fluido',
            'Conferencia Tecnica',
            'Entrega e Orientacao ao Cliente',
            'Acompanhamento Pos-servico',
        ],
    },
];

const LESSON_SUBTOPICS = [
    'Conceitos Fundamentais',
    'Checklist Operacional',
    'Preparacao do Equipamento',
    'Inspecao de Componentes',
    'Procedimento Passo a Passo',
    'Pontos de Atencao',
    'Falhas Comuns',
    'Validacao do Resultado',
    'Registro Tecnico',
    'Padrao de Qualidade',
    'Comunicacao com o Cliente',
    'Encerramento Seguro',
];

const LESSON_IMAGE_POOL = [
    'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1486496572940-2bb2341fdbdf?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1200&q=80',
];

const VIDEO_IDS = ['76979871', '22439234', '146022717', '357274789', '1084537', '327431071'];
const PDF_URLS = [
    'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    'https://www.orimi.com/pdf-test.pdf',
    'https://gahp.net/wp-content/uploads/2017/09/sample.pdf',
    'https://www.africau.edu/images/default/sample.pdf',
    'https://unec.edu.az/application/uploads/2014/12/pdf-sample.pdf',
];

function removeUndefinedFields(data) {
    return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
}

function buildPlaceholderLesson(index, moduleTitle, courseTitle) {
    const duration = 8 + ((index * 3) % 11);
    const subtopic = LESSON_SUBTOPICS[(index - 1) % LESSON_SUBTOPICS.length];

    return {
        id: `aula-${index}`,
        title: `Aula ${index}: ${subtopic}`,
        description: `Nesta aula do modulo ${moduleTitle}, o aluno aprende ${subtopic.toLowerCase()} aplicado ao curso ${courseTitle.toLowerCase()}.`,
        durationLabel: `${duration} min`,
        averageDurationMinutes: duration,
        videoEmbedUrl: `https://player.vimeo.com/video/${VIDEO_IDS[index % VIDEO_IDS.length]}`,
        pdfUrl: PDF_URLS[index % PDF_URLS.length],
        pdfLabel: `Baixar material da aula ${index}`,
        supportText: `Material complementar de apoio para reforcar ${subtopic.toLowerCase()} neste modulo.`,
        thumbnailUrl: LESSON_IMAGE_POOL[index % LESSON_IMAGE_POOL.length],
        lessonKind: 'lesson',
        sortOrder: index + 1,
        isPublished: true,
    };
}

function buildModule(courseMeta, moduleIndex, lessonCount) {
    const baseTheme = courseMeta.moduleThemes[moduleIndex - 1] || `Modulo ${moduleIndex}`;
    const moduleTitle = `Modulo ${moduleIndex}: ${baseTheme}`;
    const lessons = [
        {
            id: 'introducao',
            title: 'Introducao do Modulo',
            description: `Apresenta o objetivo do ${moduleTitle} e como ele se conecta ao restante do curso ${courseMeta.title}.`,
            lessonKind: 'introduction',
            supportText: `Orientacoes iniciais do ${moduleTitle}, sem duracao e sem PDF.`,
            thumbnailUrl: courseMeta.imageUrl,
            sortOrder: 1,
            isPublished: true,
        },
        ...Array.from({ length: lessonCount }, (_, idx) => buildPlaceholderLesson(idx + 1, moduleTitle, courseMeta.title)),
        {
            id: 'conclusao',
            title: 'Conclusao do Modulo',
            description: `Consolida os aprendizados do ${moduleTitle} e aponta os proximos passos do curso ${courseMeta.title}.`,
            lessonKind: 'conclusion',
            supportText: `Mensagem final do ${moduleTitle}, sem duracao e sem PDF.`,
            videoEmbedUrl: moduleIndex % 2 === 0 ? `https://player.vimeo.com/video/${VIDEO_IDS[(moduleIndex + 2) % VIDEO_IDS.length]}` : undefined,
            thumbnailUrl: LESSON_IMAGE_POOL[(moduleIndex + 2) % LESSON_IMAGE_POOL.length],
            sortOrder: lessonCount + 2,
            isPublished: true,
        },
    ];

    const totalDurationMinutes = lessons.reduce((sum, lesson) => sum + (lesson.averageDurationMinutes || 0), 0);

    return {
        id: `modulo-${moduleIndex}`,
        title: moduleTitle,
        summary: `Resumo do ${moduleTitle}, cobrindo rotinas e cuidados práticos ligados ao tema do modulo.`,
        description: `Modulo dedicado a ${baseTheme.toLowerCase()}, com foco em processo, qualidade e padronizacao da oficina.`,
        thumbnailUrl: LESSON_IMAGE_POOL[(moduleIndex + 3) % LESSON_IMAGE_POOL.length],
        sortOrder: moduleIndex,
        isPublished: true,
        lessons,
        totalDurationMinutes,
    };
}

function buildCourse(courseMeta, courseIndex, moduleCount, lessonBaseCount) {
    const modules = Array.from({ length: moduleCount }, (_, idx) => buildModule(courseMeta, idx + 1, lessonBaseCount + (idx % 4)));
    const totalDurationMinutes = modules.reduce((sum, module) => sum + module.totalDurationMinutes, 0);

    return {
        id: `curso-${courseIndex}`,
        title: courseMeta.title,
        description: courseMeta.description,
        imageUrl: courseMeta.imageUrl,
        sortOrder: courseIndex,
        isPublished: true,
        modules,
        totalDurationMinutes,
    };
}

const PLACEHOLDER_PLATFORM_DATA = [
    buildCourse(COURSE_CATALOG[0], 1, 3, 4),
    buildCourse(COURSE_CATALOG[1], 2, 4, 5),
    buildCourse(COURSE_CATALOG[2], 3, 5, 6),
    buildCourse(COURSE_CATALOG[3], 4, 6, 7),
    buildCourse(COURSE_CATALOG[4], 5, 7, 4),
    buildCourse(COURSE_CATALOG[5], 6, 5, 8),
];

function mapCourse(docSnap) {
    const data = docSnap.data();
    return {
        id: docSnap.id,
        title: data.title || 'Curso sem titulo',
        description: data.description || '',
        imageUrl: data.imageUrl || '',
        totalDurationMinutes: data.totalDurationMinutes || 0,
        durationLabel: data.durationLabel || formatDurationLabel(data.totalDurationMinutes || 0),
        sortOrder: data.sortOrder || 0,
        moduleCount: data.moduleCount || 0,
        isPublished: data.isPublished !== false,
    };
}

function mapModule(docSnap, courseId) {
    const data = docSnap.data();
    return {
        id: docSnap.id,
        courseId,
        title: data.title || 'Modulo sem titulo',
        summary: data.summary || '',
        description: data.description || '',
        thumbnailUrl: data.thumbnailUrl || '',
        totalDurationMinutes: data.totalDurationMinutes || 0,
        sortOrder: data.sortOrder || 0,
        lessonCount: data.lessonCount || 0,
        isPublished: data.isPublished !== false,
    };
}

function mapLesson(docSnap, courseId, moduleId) {
    const data = docSnap.data();
    return {
        id: docSnap.id,
        courseId,
        moduleId,
        title: data.title || 'Aula sem titulo',
        description: data.description || '',
        durationLabel: data.durationLabel || '',
        averageDurationMinutes: data.averageDurationMinutes || null,
        videoEmbedUrl: data.videoEmbedUrl || '',
        pdfUrl: data.pdfUrl || '',
        pdfLabel: data.pdfLabel || 'Baixar PDF',
        supportText: data.supportText || '',
        thumbnailUrl: data.thumbnailUrl || '',
        lessonKind: data.lessonKind || 'lesson',
        sortOrder: data.sortOrder || 0,
        isPublished: data.isPublished !== false,
    };
}

function formatDurationLabel(totalMinutes) {
    if (!totalMinutes) return '0 min';
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (!hours) return `${minutes} min`;
    if (!minutes) return `${hours}h`;
    return `${hours}h ${minutes}min`;
}

export async function fetchLearningCourses() {
    const snapshot = await getDocs(collection(db, COURSES_COLLECTION));
    return snapshot.docs
        .map(mapCourse)
        .filter(course => course.isPublished)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
}

export async function fetchCourseModules(courseId) {
    const snapshot = await getDocs(collection(db, COURSES_COLLECTION, courseId, 'modules'));
    return snapshot.docs
        .map(docSnap => mapModule(docSnap, courseId))
        .filter(module => module.isPublished)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
}

export async function fetchModuleLessons(courseId, moduleId) {
    const snapshot = await getDocs(collection(db, COURSES_COLLECTION, courseId, 'modules', moduleId, 'lessons'));
    return snapshot.docs
        .map(docSnap => mapLesson(docSnap, courseId, moduleId))
        .filter(lesson => lesson.isPublished)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
}

export async function fetchLearningLesson(courseId, moduleId, lessonId) {
    const snapshot = await getDoc(doc(db, COURSES_COLLECTION, courseId, 'modules', moduleId, 'lessons', lessonId));
    if (!snapshot.exists()) return null;
    const lesson = mapLesson(snapshot, courseId, moduleId);
    return lesson.isPublished ? lesson : null;
}

export async function clearLearningPlatformData() {
    const coursesSnapshot = await getDocs(collection(db, COURSES_COLLECTION));
    if (coursesSnapshot.empty) return;

    const batch = writeBatch(db);

    for (const courseDoc of coursesSnapshot.docs) {
        const modulesSnapshot = await getDocs(collection(db, COURSES_COLLECTION, courseDoc.id, 'modules'));
        for (const moduleDoc of modulesSnapshot.docs) {
            const lessonsSnapshot = await getDocs(collection(db, COURSES_COLLECTION, courseDoc.id, 'modules', moduleDoc.id, 'lessons'));
            lessonsSnapshot.docs.forEach(lessonDoc => {
                batch.delete(doc(db, COURSES_COLLECTION, courseDoc.id, 'modules', moduleDoc.id, 'lessons', lessonDoc.id));
            });
            batch.delete(doc(db, COURSES_COLLECTION, courseDoc.id, 'modules', moduleDoc.id));
        }
        batch.delete(doc(db, COURSES_COLLECTION, courseDoc.id));
    }

    await batch.commit();
}

export async function seedLearningPlatformData() {
    const batch = writeBatch(db);

    PLACEHOLDER_PLATFORM_DATA.forEach(course => {
        const courseRef = doc(db, COURSES_COLLECTION, course.id);
        batch.set(courseRef, removeUndefinedFields({
            title: course.title,
            description: course.description,
            imageUrl: course.imageUrl,
            totalDurationMinutes: course.totalDurationMinutes,
            durationLabel: formatDurationLabel(course.totalDurationMinutes),
            sortOrder: course.sortOrder,
            moduleCount: course.modules.length,
            isPublished: course.isPublished,
            updatedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
        }), { merge: true });

        course.modules.forEach(module => {
            const moduleRef = doc(db, COURSES_COLLECTION, course.id, 'modules', module.id);
            batch.set(moduleRef, removeUndefinedFields({
                title: module.title,
                summary: module.summary,
                description: module.description,
                thumbnailUrl: module.thumbnailUrl,
                totalDurationMinutes: module.totalDurationMinutes,
                sortOrder: module.sortOrder,
                lessonCount: module.lessons.length,
                isPublished: module.isPublished,
                updatedAt: serverTimestamp(),
                createdAt: serverTimestamp(),
            }), { merge: true });

            module.lessons.forEach(lesson => {
                const lessonRef = doc(db, COURSES_COLLECTION, course.id, 'modules', module.id, 'lessons', lesson.id);
                batch.set(lessonRef, removeUndefinedFields({
                    title: lesson.title,
                    description: lesson.description,
                    durationLabel: lesson.durationLabel,
                    averageDurationMinutes: lesson.averageDurationMinutes,
                    videoEmbedUrl: lesson.videoEmbedUrl,
                    pdfUrl: lesson.pdfUrl,
                    pdfLabel: lesson.pdfLabel,
                    supportText: lesson.supportText,
                    thumbnailUrl: lesson.thumbnailUrl,
                    lessonKind: lesson.lessonKind || 'lesson',
                    sortOrder: lesson.sortOrder,
                    isPublished: lesson.isPublished,
                    updatedAt: serverTimestamp(),
                    createdAt: serverTimestamp(),
                }), { merge: true });
            });
        });
    });

    await batch.commit();
}
