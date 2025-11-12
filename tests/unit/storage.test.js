const storage = require("../../src/services/storage");

beforeEach(() => {
    storage.reset();
    storage.seed();
});

test("should NOT allow duplicate course title", () => {
  const result = storage.create("courses", {
    title: "Math",
    teacher: "Someone",
  });
  expect(result.error).toBe("Course title must be unique");
});

test("should list seeded students", () => {
    const students = storage.list("students");
    expect(students.length).toBe(3);
    expect(students[0].name).toBe("Alice");
});

test("should create a new student", () => {
    const result = storage.create("students", {
        name: "David",
        email: "david@example.com",
    });
    expect(result.name).toBe("David");
    expect(storage.list("students").length).toBe(4);
});

test("should not allow duplicate student email", () => {
    const result = storage.create("students", {
        name: "Eve",
        email: "alice@example.com",
    });
    expect(result.error).toBe("Email must be unique");
});

test("should delete a student", () => {
    const students = storage.list("students");
    const result = storage.remove("students", students[0].id);
    expect(result).toBe(true);
});

test("should NOT allow more than 3 students in a course", () => {
  const students = storage.list("students");
  const course = storage.list("courses")[0];
  storage.create("students", { name: "Extra", email: "extra@example.com" });
  storage.create("students", { name: "Extra2", email: "extra2@example.com" });
  storage.enroll(students[0].id, course.id);
  storage.enroll(students[1].id, course.id);
  storage.enroll(students[2].id, course.id);
  const result = storage.enroll(4, course.id);
  expect(result.error).toBe("Course is full");
});
