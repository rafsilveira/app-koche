import { useEffect, useState } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, Clock3, FileText, GraduationCap, Layers3, PartyPopper, PlayCircle, Search } from 'lucide-react';
import PropTypes from 'prop-types';
import { fetchCourseModules, fetchLearningCourses, fetchLearningLesson, fetchModuleLessons } from '../services/learningService';

export default function LearningPlatformScreen({ onBack }) {
    const [view, setView] = useState('courses');
    const [courses, setCourses] = useState([]);
    const [expandedCourseId, setExpandedCourseId] = useState(null);
    const [courseFilter, setCourseFilter] = useState('');
    const [modules, setModules] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [selectedModule, setSelectedModule] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [selectedLesson, setSelectedLesson] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadCourses();
    }, []);

    async function loadCourses() {
        try {
            setLoading(true);
            setError('');
            const data = await fetchLearningCourses();
            const coursesWithModules = await Promise.all(
                data.map(async (course) => ({
                    ...course,
                    previewModules: await fetchCourseModules(course.id),
                }))
            );
            setCourses(coursesWithModules);
        } catch (err) {
            console.error(err);
            setError('Nao foi possivel carregar os cursos da plataforma de ensino.');
        } finally {
            setLoading(false);
        }
    }

    function toggleCourseModules(courseId) {
        if (expandedCourseId === courseId) {
            setExpandedCourseId(null);
            return;
        }

        setExpandedCourseId(courseId);
    }

    async function handleOpenCourse(course) {
        try {
            setLoading(true);
            setError('');
            const courseModules = await fetchCourseModules(course.id);
            setSelectedCourse(course);
            setModules(courseModules);
            setSelectedModule(null);
            setSelectedLesson(null);
            setLessons([]);
            setView('modules');
        } catch (err) {
            console.error(err);
            setError('Nao foi possivel carregar os modulos deste curso.');
        } finally {
            setLoading(false);
        }
    }

    async function handleOpenModule(module) {
        try {
            setLoading(true);
            setError('');
            const moduleLessons = await fetchModuleLessons(module.courseId, module.id);
            setSelectedModule(module);
            setLessons(moduleLessons);
            setSelectedLesson(null);
            setView('lessons');
        } catch (err) {
            console.error(err);
            setError('Nao foi possivel carregar as aulas deste modulo.');
        } finally {
            setLoading(false);
        }
    }

    async function handleOpenLesson(lesson) {
        try {
            setLoading(true);
            setError('');
            const fullLesson = await fetchLearningLesson(lesson.courseId, lesson.moduleId, lesson.id);
            setSelectedLesson(fullLesson || lesson);
            setView('lesson');
        } catch (err) {
            console.error(err);
            setError('Nao foi possivel carregar os detalhes desta aula.');
        } finally {
            setLoading(false);
        }
    }

    function handleBackInternal() {
        if (view === 'lesson') {
            setView('lessons');
            return;
        }

        if (view === 'lessons') {
            setView('modules');
            setSelectedLesson(null);
            return;
        }

        if (view === 'modules') {
            setView('courses');
            setSelectedCourse(null);
            setSelectedModule(null);
            setSelectedLesson(null);
            setModules([]);
            setLessons([]);
            return;
        }

        onBack();
    }

    const currentLessonIndex = selectedLesson ? lessons.findIndex(lesson => lesson.id === selectedLesson.id) : -1;
    const totalLessons = lessons.length;
    const contentLessons = lessons.filter(lesson => lesson.lessonKind !== 'introduction' && lesson.lessonKind !== 'conclusion');
    const contentLessonIds = contentLessons.map(lesson => lesson.id);
    const contentIndex = selectedLesson ? contentLessonIds.indexOf(selectedLesson.id) : -1;
    let progressPercent = 0;
    if (selectedLesson?.lessonKind === 'conclusion') progressPercent = 100;
    else if (selectedLesson?.lessonKind === 'introduction') progressPercent = 0;
    else if (contentIndex >= 0 && contentLessons.length > 0) progressPercent = Math.round(((contentIndex + 1) / (contentLessons.length + 1)) * 100);
    const previousLesson = currentLessonIndex > 0 ? lessons[currentLessonIndex - 1] : null;
    const nextLesson = currentLessonIndex >= 0 && currentLessonIndex < totalLessons - 1 ? lessons[currentLessonIndex + 1] : null;
    const showVideo = Boolean(selectedLesson?.videoEmbedUrl);
    const showDuration = Boolean(selectedLesson?.durationLabel) && selectedLesson?.lessonKind === 'lesson';
    const showPdf = Boolean(selectedLesson?.pdfUrl) && selectedLesson?.lessonKind === 'lesson';
    const currentModuleIndex = selectedModule ? modules.findIndex(module => module.id === selectedModule.id) : -1;
    const nextModule = currentModuleIndex >= 0 && currentModuleIndex < modules.length - 1 ? modules[currentModuleIndex + 1] : null;
    const totalCourseLessons = modules.reduce((sum, module) => sum + (module.lessonCount || 0), 0);
    const filteredCourses = courses.filter(course => {
        const haystack = `${course.title} ${course.description}`.toLowerCase();
        return haystack.includes(courseFilter.trim().toLowerCase());
    });

    function formatDuration(totalMinutes) {
        if (!totalMinutes) return '0 min';
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        if (!hours) return `${minutes} min`;
        if (!minutes) return `${hours}h`;
        return `${hours}h ${minutes}min`;
    }

    return (
        <div className="container" style={{ maxWidth: '980px' }}>
            <div className="app-header" style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'center' }}>
                <button onClick={handleBackInternal} className="btn-outlined" style={{ padding: '8px 12px' }}>
                    <ChevronLeft size={18} /> Voltar
                </button>
                <h2 style={{ margin: 0 }}>Plataforma de Ensino</h2>
                <div style={{ width: '80px' }}></div>
            </div>

            {error && (
                <div className="card" style={{ marginBottom: '1rem', padding: '1rem', borderLeft: '4px solid var(--koche-red)', color: 'var(--text-primary)' }}>
                    {error}
                </div>
            )}

            {loading && (
                <div className="card" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Carregando conteudo da plataforma...
                </div>
            )}

            {!loading && view === 'courses' && (
                <div className="card" style={{ marginBottom: '1rem', padding: '1.5rem', borderLeft: '4px solid var(--koche-blue)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
                        <div>
                            <h3 style={{ margin: '0 0 0.4rem 0', color: 'var(--koche-blue)' }}>Bem-vindo à Plataforma de Ensino</h3>
                            <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: '1.6' }}>Escolha um curso para visualizar seus modulos e avancar pelo conteudo.</p>
                        </div>
                        <div style={{ padding: '0.9rem 1.1rem', borderRadius: '12px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--koche-blue)', fontWeight: '700' }}>
                            {courses.length} curso(s)
                        </div>
                    </div>

                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input
                            type="text"
                            value={courseFilter}
                            onChange={e => setCourseFilter(e.target.value)}
                            placeholder="Filtrar cursos por titulo ou descricao..."
                            style={{ width: '100%', padding: '0.95rem 1rem 0.95rem 2.6rem', borderRadius: '10px', border: '1px solid var(--koche-blue)', background: 'white', color: 'var(--text-primary)' }}
                        />
                    </div>
                </div>
            )}

            {!loading && view === 'courses' && courses.length === 0 && (
                <div className="card" style={{ padding: '1.5rem' }}>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Nenhum curso encontrado no banco da plataforma de ensino.</p>
                </div>
            )}

            {!loading && view === 'courses' && courses.length > 0 && filteredCourses.length === 0 && (
                <div className="card" style={{ padding: '1.5rem' }}>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Nenhum curso corresponde ao filtro informado.</p>
                </div>
            )}

            {!loading && view === 'courses' && filteredCourses.length > 0 && (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {filteredCourses.map(course => {
                        const isExpanded = expandedCourseId === course.id;
                        return (
                            <div key={course.id} className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--koche-silver)', background: 'white' }}>
                                {course.imageUrl && (
                                    <div style={{ height: '220px', overflow: 'hidden', background: '#E5E7EB' }}>
                                        <img src={course.imageUrl} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                )}
                                <div style={{ padding: '1.5rem', display: 'grid', gap: '1rem' }}>
                                    <div>
                                        <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--koche-blue)' }}>{course.title}</h3>
                                        <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: '1.6' }}>{course.description}</p>
                                    </div>

                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--koche-blue)', fontWeight: '700' }}>
                                        <Clock3 size={18} /> Duracao estimada: {course.durationLabel}
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                        <button type="button" onClick={() => handleOpenCourse(course)} className="btn-primary" style={{ textTransform: 'none' }}>
                                            <GraduationCap size={18} /> Acessar Curso
                                        </button>
                                        <button type="button" onClick={() => toggleCourseModules(course.id)} className="btn-elevated" style={{ textTransform: 'none', color: 'var(--koche-blue)', border: '1px solid var(--koche-blue)' }}>
                                            <Layers3 size={18} /> {isExpanded ? 'Ocultar Módulos' : `Listar ${course.moduleCount} Módulos`}
                                        </button>
                                    </div>

                                    {isExpanded && (
                                        <div style={{ padding: '1rem', borderRadius: '8px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)' }}>
                                            <div style={{ color: 'var(--koche-blue)', fontWeight: '700', marginBottom: '0.75rem' }}>Modulos do curso</div>
                                            <div style={{ display: 'grid', gap: '0.6rem' }}>
                                                {(course.previewModules || []).map(module => (
                                                    <div key={module.id} style={{ color: 'var(--text-secondary)' }}>{module.title}</div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {!loading && view === 'modules' && selectedCourse && (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    <div className="card" style={{ padding: 0, overflow: 'hidden', border: '3px solid var(--koche-blue)', background: 'linear-gradient(180deg, rgba(25, 77, 138, 0.08), white 38%)', boxShadow: 'var(--elevation-2)' }}>
                        {selectedCourse.imageUrl && (
                            <div style={{ height: '220px', overflow: 'hidden', background: '#E5E7EB' }}>
                                <img src={selectedCourse.imageUrl} alt={selectedCourse.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                        )}
                        <div style={{ padding: '1.5rem', display: 'grid', gap: '1rem' }}>
                            <div>
                                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--koche-blue)' }}>{selectedCourse.title}</h3>
                                <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: '1.6' }}>{selectedCourse.description}</p>
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1rem', borderRadius: '10px', background: 'white', border: '1px solid rgba(25, 77, 138, 0.18)', color: 'var(--koche-blue)', fontWeight: '700' }}>
                                    <Clock3 size={18} /> Duracao estimada: {selectedCourse.durationLabel}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1rem', borderRadius: '10px', background: 'white', border: '1px solid rgba(25, 77, 138, 0.18)', color: 'var(--koche-blue)', fontWeight: '700' }}>
                                    <Layers3 size={18} /> {selectedCourse.moduleCount} módulo(s)
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1rem', borderRadius: '10px', background: 'white', border: '1px solid rgba(25, 77, 138, 0.18)', color: 'var(--koche-blue)', fontWeight: '700' }}>
                                    <GraduationCap size={18} /> {totalCourseLessons} aula(s)
                                </div>
                            </div>
                        </div>
                    </div>

                    {modules.map(module => (
                        <button key={module.id} type="button" onClick={() => handleOpenModule(module)} className="card" style={{ padding: 0, textAlign: 'left', cursor: 'pointer', overflow: 'hidden', border: '1px solid var(--koche-silver)', background: 'white' }}>
                            {module.thumbnailUrl && (
                                <div style={{ height: '220px', overflow: 'hidden', background: '#E5E7EB' }}>
                                    <img src={module.thumbnailUrl} alt={module.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                            )}
                            <div style={{ padding: '1.5rem', display: 'grid', gap: '1rem' }}>
                                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--koche-blue)' }}>{module.title}</h3>
                                <p style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{module.summary || module.description}</p>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', color: 'var(--koche-blue)', fontWeight: '600' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Layers3 size={18} /> {module.lessonCount} aula(s)
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Clock3 size={18} /> Duracao estimada: {formatDuration(module.totalDurationMinutes)}
                                        </div>
                                    </div>
                                    <div className="btn-primary" style={{ textTransform: 'none', pointerEvents: 'none' }}>
                                        <BookOpen size={18} /> Acessar Módulo
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {!loading && view === 'lessons' && selectedModule && (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--koche-blue)' }}>{selectedModule.title}</h3>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: '1.6' }}>{selectedModule.description || selectedModule.summary}</p>
                    </div>

                    {lessons.map(lesson => (
                        <button key={lesson.id} type="button" onClick={() => handleOpenLesson(lesson)} className="card" style={{ padding: '1rem', textAlign: 'left', display: 'flex', gap: '1rem', alignItems: 'center', cursor: 'pointer', background: 'white', border: '1px solid var(--koche-silver)' }}>
                            <div style={{ width: '140px', height: '80px', position: 'relative', overflow: 'hidden', borderRadius: '8px', flexShrink: 0, background: '#E5E7EB' }}>
                                {lesson.thumbnailUrl && <img src={lesson.thumbnailUrl} alt={lesson.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#fff', background: 'rgba(0,0,0,0.6)', borderRadius: '50%', padding: '8px' }}>
                                    <PlayCircle size={22} fill="currentColor" />
                                </div>
                            </div>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--koche-blue)' }}>{lesson.title}</h4>
                                <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: '1.5' }}>{lesson.description}</p>
                                {lesson.durationLabel && (
                                    <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--koche-blue)', fontWeight: '600' }}>
                                        <Clock3 size={16} /> {lesson.durationLabel}
                                    </div>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {!loading && view === 'lesson' && selectedLesson && (
                <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--koche-blue)' }}>
                    {selectedModule && totalLessons > 0 && (
                        <div style={{ marginBottom: '1.5rem', display: 'grid', gap: '0.85rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                <div>
                                    <div style={{ color: 'var(--koche-blue)', fontWeight: '700', marginBottom: '0.2rem' }}>{selectedModule.title}</div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Progresso no modulo: etapa {currentLessonIndex + 1} de {totalLessons}</div>
                                </div>
                                <div style={{ color: 'var(--koche-blue)', fontWeight: '700' }}>{progressPercent}%</div>
                            </div>

                            <div style={{ height: '10px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                                <div style={{ width: `${progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, var(--koche-blue), var(--koche-red))', borderRadius: '999px' }} />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'stretch', gap: '0.75rem', flexWrap: 'wrap' }}>
                                <button type="button" onClick={() => previousLesson && handleOpenLesson(previousLesson)} disabled={!previousLesson || loading} className="btn-primary" style={{ padding: '0.85rem 1rem', opacity: previousLesson ? 1 : 0.55, minHeight: '52px', width: '220px', justifyContent: 'center', textTransform: 'none' }}>
                                    <ChevronLeft size={18} /> Aula Anterior
                                </button>
                                <button type="button" onClick={() => nextLesson && handleOpenLesson(nextLesson)} disabled={!nextLesson || loading} className="btn-primary" style={{ padding: '0.85rem 1rem', opacity: nextLesson ? 1 : 0.55, minHeight: '52px', width: '220px', justifyContent: 'center', textTransform: 'none' }}>
                                    Proxima Aula <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}

                    {showVideo && (
                        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, background: '#000', borderRadius: 'var(--radius-sm)', overflow: 'hidden', boxShadow: 'var(--elevation-2)' }}>
                            <iframe src={selectedLesson.videoEmbedUrl} title={selectedLesson.title} frameBorder="0" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
                        </div>
                    )}

                    <div style={{ marginTop: showVideo ? '1.5rem' : 0, display: 'grid', gap: '1rem' }}>
                        <div>
                            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--koche-blue)' }}>{selectedLesson.title}</h3>
                            <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: '1.6' }}>{selectedLesson.description}</p>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                            {showDuration && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1rem', background: 'var(--bg-dark)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                    <Clock3 size={18} color="var(--koche-blue)" />
                                    <span style={{ color: 'var(--text-primary)' }}>Duracao media: {selectedLesson.durationLabel}</span>
                                </div>
                            )}

                            {showPdf && (
                                <a href={selectedLesson.pdfUrl} target="_blank" rel="noreferrer" className="btn-elevated" style={{ padding: '0.85rem 1rem', color: 'var(--koche-red)', border: '1px solid var(--koche-red)', textDecoration: 'none' }}>
                                    <FileText size={18} /> {selectedLesson.pdfLabel}
                                </a>
                            )}
                        </div>

                        {selectedLesson.supportText && (
                            <div style={{ padding: '1rem', borderRadius: '8px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                                {selectedLesson.supportText}
                            </div>
                        )}

                        {selectedLesson.lessonKind === 'conclusion' && (
                            nextModule ? (
                                <button type="button" onClick={() => handleOpenModule(nextModule)} className="btn-primary" style={{ justifyContent: 'center', padding: '1rem', textTransform: 'none', marginTop: '0.5rem' }}>
                                    Iniciar Proximo Modulo <ChevronRight size={18} />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setView('courses');
                                        setSelectedLesson(null);
                                        setSelectedModule(null);
                                        setSelectedCourse(null);
                                        setModules([]);
                                        setLessons([]);
                                    }}
                                    className="btn-elevated"
                                    style={{ justifyContent: 'center', padding: '1rem', textTransform: 'none', marginTop: '0.5rem', background: 'rgba(34, 197, 94, 0.16)', color: '#166534', border: '1px solid #22c55e' }}
                                >
                                    <PartyPopper size={18} /> Parabéns, você concluiu este curso!
                                </button>
                            )
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

LearningPlatformScreen.propTypes = {
    onBack: PropTypes.func.isRequired,
};
