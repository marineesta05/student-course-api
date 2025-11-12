const request = require("supertest");
const app = require("../../src/app");
const storage = require("../../src/services/storage");

describe("Student-Course API integration", () => {
    beforeEach(() => {
        require("../../src/services/storage").reset();
        require("../../src/services/storage").seed();
    });

    test("GET /students should return seeded students", async () => {
        const res = await request(app).get("/students");
        expect(res.statusCode).toBe(200);
        expect(res.body.students.length).toBe(3);
        expect(res.body.students[0].name).toBe("Alice");
    });

    test("POST /students should create a new student", async () => {
        const res = await request(app)
            .post("/students")
            .send({ name: "David", email: "david@example.com" });
        expect(res.statusCode).toBe(201);
        expect(res.body.name).toBe("David");
    });

    test("POST /students should not allow duplicate email", async () => {
        const res = await request(app)
            .post("/students")
            .send({ name: "Eve", email: "alice@example.com" });
        expect(res.statusCode).toBe(400);
    });

    test("DELETE /courses/:id should return 400 when course has enrolled students", async () => {
        // Teste que la suppression échoue quand des étudiants sont inscrits au cours
        const courses = await request(app).get("/courses");
        const courseId = courses.body.courses[0].id;

        // Inscrire un étudiant au cours
        const students = await request(app).get("/students");
        const studentId = students.body.students[0].id;
        await request(app).post(`/courses/${courseId}/students/${studentId}`);

        const res = await request(app).delete(`/courses/${courseId}`);
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBeDefined();
    });

    test("GET /students?name=Alice&email=alice@example.com&page=1&limit=1 filtre et pagine correctement", async () => {
        const res = await request(app).get(
            "/students?name=Alice&email=alice@example.com&page=1&limit=1"
        );
        expect(res.statusCode).toBe(200);
        expect(res.body.students.length).toBeGreaterThan(0);
        expect(res.body.students[0].name).toContain("Alice");
        expect(res.body.total).toBeGreaterThan(0);
    });

    test("GET /students/:id retourne les infos et les cours", async () => {
        const res = await request(app).get("/students/1");
        expect(res.statusCode).toBe(200);
        expect(res.body.student).toBeDefined();
        expect(Array.isArray(res.body.courses)).toBe(true);
    });

    test("GET /students/:id retourne 404 si étudiant inexistant", async () => {
        const res = await request(app).get("/students/9999");
        expect(res.statusCode).toBe(404);
        expect(res.body.error).toMatch(/not found/i);
    });

    test("PUT /students/:id met à jour nom et email", async () => {
        const res = await request(app)
            .put("/students/1")
            .send({ name: "Alicia", email: "alicia@example.com" });
        expect(res.statusCode).toBe(200);
        expect(res.body.name).toBe("Alicia");
        expect(res.body.email).toBe("alicia@example.com");
    });

    test("DELETE /students/:id supprime un étudiant existant", async () => {
        const created = await request(app)
            .post("/students")
            .send({ name: "Temp", email: "temp@example.com" });
        const res = await request(app).delete(`/students/${created.body.id}`);
        expect(res.statusCode).toBe(204);
    });

    test("GET /courses/:id retourne 404 si cour inexistant", async () => {
        const res = await request(app).get("/courses/9999");
        expect(res.statusCode).toBe(404);
        expect(res.body.error).toMatch(/not found/i);
    });

    test("GET /courses/:id retourne le cours demandé", async () => {
        const list = await request(app).get("/courses");
        const courseId = list.body.courses[0].id;

        const res = await request(app).get(`/courses/${courseId}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.course).toBeDefined();
        expect(res.body.course.id).toBe(courseId);
    });

    test("PUT /courses/:id should update title and teacher successfully", async () => {
        const course = storage.list("courses")[0];
        const res = await request(app)
            .put(`/courses/${course.id}`)
            .send({ title: "Updated Title", teacher: "Updated Teacher" });
        expect(res.statusCode).toBe(200);
        expect(res.body.title).toBe("Updated Title");
        expect(res.body.teacher).toBe("Updated Teacher");
    });

    // Tests pour couvrir les lignes manquantes dans studentsController.js

    test("POST /students should handle storage errors properly", async () => {
        // Teste la gestion des erreurs de stockage lors de la création d'étudiant
        const res = await request(app)
            .post("/students")
            .send({ name: "Eve", email: "alice@example.com" }); // Email dupliqué
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBeDefined();
    });

    test("DELETE /students/:id should handle storage errors for non-existent student", async () => {
        // Teste la gestion des erreurs de stockage lors de la suppression
        const res = await request(app).delete("/students/9999"); // ID inexistant
        expect(res.statusCode).toBe(404);
        expect(res.body.error).toMatch(/not found/i);
    });

    // Tests pour couvrir les lignes manquantes dans coursesController.js

    test("PUT /courses/:id should handle partial updates - title only", async () => {
        // Teste la mise à jour partielle d'un cours (seul le titre)
        const courses = await request(app).get("/courses");
        const courseId = courses.body.courses[0].id;

        const res = await request(app)
            .put(`/courses/${courseId}`)
            .send({ title: "Updated Title Only" });
        expect(res.statusCode).toBe(200);
        expect(res.body.title).toBe("Updated Title Only");
    });

    test("PUT /courses/:id should handle partial updates - teacher only", async () => {
        // Teste la mise à jour partielle d'un cours (seul le teacher)
        const courses = await request(app).get("/courses");
        const courseId = courses.body.courses[0].id;

        const res = await request(app)
            .put(`/courses/${courseId}`)
            .send({ teacher: "Updated Teacher Only" });
        expect(res.statusCode).toBe(200);
        expect(res.body.teacher).toBe("Updated Teacher Only");
    });

    test("DELETE /courses/:id should succeed when no students enrolled", async () => {
        // Teste que la suppression réussit quand aucun étudiant n'est inscrit
        const courses = await request(app).get("/courses");

        // Trouver un cours sans étudiants
        let courseWithoutStudents;
        for (const course of courses.body.courses) {
            const courseDetails = await request(app).get(
                `/courses/${course.id}`
            );
            if (courseDetails.body.students.length === 0) {
                courseWithoutStudents = course;
                break;
            }
        }

        if (courseWithoutStudents) {
            const res = await request(app).delete(
                `/courses/${courseWithoutStudents.id}`
            );
            expect(res.statusCode).toBe(204);
        }
    });

    test("DELETE /courses/:courseId/students/:studentId should unenroll student", async () => {
        // Teste la désinscription d'un étudiant d'un cours
        const courses = await request(app).get("/courses");
        const students = await request(app).get("/students");

        const courseId = courses.body.courses[0].id;
        const studentId = students.body.students[0].id;

        // D'abord inscrire l'étudiant
        await request(app).post(`/courses/${courseId}/students/${studentId}`);

        // Puis le désinscrire
        const res = await request(app).delete(
            `/courses/${courseId}/students/${studentId}`
        );
        expect([200]).toContain(res.statusCode); // Peut être 200 ou 204 selon l'implémentation
    });

    test("GET /nonexistent-route should return 404", async () => {
        // Teste la gestion des routes inexistantes
        const res = await request(app).get("/nonexistent-route");
        expect(res.statusCode).toBe(404);
        expect(res.body.error).toMatch(/not found/i);
    });

    test("POST /students should validate required fields", async () => {
        // Teste la validation des champs requis pour la création d'étudiant
        const res = await request(app)
            .post("/students")
            .send({ name: "Only Name" });
        expect(res.statusCode).toBe(400);
    });

    test("Enrollment integration between students and courses", async () => {
        // Teste l'intégration entre étudiants et cours via l'enrollment
        const students = await request(app).get("/students");
        const courses = await request(app).get("/courses");

        const studentId = students.body.students[0].id;
        const courseId = courses.body.courses[0].id;

        // Test enrollment
        const enrollRes = await request(app).post(
            `/courses/${courseId}/students/${studentId}`
        );
        expect([200, 201]).toContain(enrollRes.statusCode);
    });

    // Tests pour la gestion des erreurs

    test("PUT /students/:id should not allow duplicate email", async () => {
        // Teste l'unicité de l'email lors de la mise à jour
        const students = await request(app).get("/students");
        const secondStudent = students.body.students[1];

        const res = await request(app)
            .put("/students/1")
            .send({ email: secondStudent.email });
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/unique/i);
    });

    test("PUT /courses/:id should not allow duplicate title", async () => {
        // Teste l'unicité du titre lors de la mise à jour
        const courses = await request(app).get("/courses");
        const firstCourse = courses.body.courses[0];
        const secondCourse = courses.body.courses[1];

        const res = await request(app)
            .put(`/courses/${firstCourse.id}`)
            .send({ title: secondCourse.title });
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/unique/i);
    });

    // Tests pour les scénarios de pagination et filtrage

    test("GET /courses should filter by title and teacher with pagination", async () => {
        // Teste le filtrage et la pagination des cours
        const res = await request(app).get(
            "/courses?title=Math&teacher=Someone&page=1&limit=10"
        );
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.courses)).toBe(true);
        expect(res.body.total).toBeGreaterThanOrEqual(0);
    });

    test("GET /students should handle pagination with large page number", async () => {
        // Teste la pagination avec un numéro de page élevé (doit retourner une liste vide)
        const res = await request(app).get("/students?page=100&limit=10");
        expect(res.statusCode).toBe(200);
        expect(res.body.students.length).toBe(0);
        expect(res.body.total).toBe(3);
    });

    // Test pour la création de cours avec succès
    test("POST /courses should create new course successfully", async () => {
        const res = await request(app)
            .post("/courses")
            .send({ title: "Biology", teacher: "Dr. Wilson" });
        expect(res.statusCode).toBe(201);
        expect(res.body.title).toBe("Biology");
        expect(res.body.teacher).toBe("Dr. Wilson");
    });

    // Test pour vérifier que les étudiants sont bien retournés avec un cours
    test("GET /courses/:id should return students array", async () => {
        const courses = await request(app).get("/courses");
        const courseId = courses.body.courses[0].id;

        const res = await request(app).get(`/courses/${courseId}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.course).toBeDefined();
        expect(Array.isArray(res.body.students)).toBe(true);
    });
});
