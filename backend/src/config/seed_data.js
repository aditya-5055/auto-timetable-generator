const sequelize = require('./db');
const Department = require('../models/Department');
const Division = require('../models/Division');
const Batch = require('../models/Batch');
const Instructor = require('../models/Instructor');
const Room = require('../models/Room');
const Course = require('../models/Course');
const MeetingTime = require('../models/MeetingTime');
const Section = require('../models/Section');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

async function seedData() {
  const transaction = await sequelize.transaction();
  try {
    console.log('🗑️  Clearing all existing timetable data...');
    // Delete in order to avoid foreign key cascades issues
    await Section.destroy({ where: {}, truncate: false, transaction });
    await sequelize.query('DELETE FROM course_instructors', { transaction });
    await Course.destroy({ where: {}, truncate: false, transaction });
    await MeetingTime.destroy({ where: {}, truncate: false, transaction });
    await Room.destroy({ where: {}, truncate: false, transaction });
    await Instructor.destroy({ where: {}, truncate: false, transaction });
    await Batch.destroy({ where: {}, truncate: false, transaction });
    await Division.destroy({ where: {}, truncate: false, transaction });
    await Department.destroy({ where: {}, truncate: false, transaction });
    console.log('✅ Old data cleared.');

    // 1. Create Department
    console.log('📦 Seeding Department...');
    const dept = await Department.create({ deptName: 'Computer Engineering' }, { transaction });

    // 2. Create Divisions
    console.log('📦 Seeding Divisions...');
    const divTE1 = await Division.create({ divisionName: 'TE-I', departmentId: dept.id, totalStudents: 88, electiveGroup: 'G1' }, { transaction });
    const divTE2 = await Division.create({ divisionName: 'TE-II', departmentId: dept.id, totalStudents: 88, electiveGroup: 'G1' }, { transaction });
    const divTE3 = await Division.create({ divisionName: 'TE-III', departmentId: dept.id, totalStudents: 88, electiveGroup: 'G2' }, { transaction });
    const divTE4 = await Division.create({ divisionName: 'TE-IV', departmentId: dept.id, totalStudents: 88, electiveGroup: 'G2' }, { transaction });

    // 3. Create Batches (4 per division)
    console.log('📦 Seeding Batches...');
    const batches = [];
    const divList = [
      { div: divTE1, suffix: '1' },
      { div: divTE2, suffix: '2' },
      { div: divTE3, suffix: '3' },
      { div: divTE4, suffix: '4' }
    ];
    for (const d of divList) {
      for (const bName of ['K', 'L', 'M', 'N']) {
        const batchObj = await Batch.create({
          batchName: `${bName}${d.suffix}`,
          divisionId: d.div.id,
          studentCount: 22
        }, { transaction });
        batches.push(batchObj);
      }
    }

    // 4. Create Instructors (T001 to T020)
    console.log('📦 Seeding Instructors...');
    const instructors = {};
    const instructorData = [
      { uid: 'T001', name: 'Dr. S.N. Girme', ml: 3, mb: 4 },
      { uid: 'T002', name: 'Prof. Rutuja Kulkarni', ml: 3, mb: 4 },
      { uid: 'T003', name: 'Prof. A.D. Bundele', ml: 3, mb: 4 },
      { uid: 'T004', name: 'Prof. M.V. Mane', ml: 3, mb: 4 },
      { uid: 'T005', name: 'Prof. P.P. Joshi', ml: 3, mb: 4 },
      { uid: 'T006', name: 'Prof. P.A. Jain', ml: 3, mb: 4 },
      { uid: 'T007', name: 'Prof. P.J. Jambhulkar', ml: 3, mb: 4 },
      { uid: 'T008', name: 'Prof. S.W. Jadhav', ml: 3, mb: 4 },
      { uid: 'T009', name: 'Prof. B.P. Masram', ml: 3, mb: 4 },
      { uid: 'T010', name: 'Prof. A.A. Chandorkar', ml: 3, mb: 4 },
      { uid: 'T011', name: 'Prof. D.D. Raigar', ml: 3, mb: 4 },
      { uid: 'T012', name: 'Prof. M.S. Wakode', ml: 3, mb: 4 },
      { uid: 'T013', name: 'Prof. K.R. Urane', ml: 3, mb: 4 },
      { uid: 'T014', name: 'Prof. N.Y. Kapadnis', ml: 3, mb: 4 },
      { uid: 'T015', name: 'Prof. Kopal Gangrade', ml: 3, mb: 4 },
      { uid: 'T016', name: 'Prof. P.R. Navghare', ml: 3, mb: 4 },
      { uid: 'T017', name: 'Dr. P.R. Patil', ml: 3, mb: 4 },
      { uid: 'T018', name: 'Prof. Deepika Kumari', ml: 3, mb: 4 },
      { uid: 'T019', name: 'Prof. Madhuri Patil', ml: 3, mb: 4 },
      { uid: 'T020', name: 'Prof. R.R. Jadhav', ml: 3, mb: 4 }
    ];
    for (const inst of instructorData) {
      const instObj = await Instructor.create({
        uid: inst.uid,
        name: inst.name,
        maxLecturesPerWeek: inst.ml,
        maxLabsPerWeek: inst.mb
      }, { transaction });
      instructors[inst.uid] = instObj;
    }

    // 5. Create Rooms
    console.log('📦 Seeding Lecture & Lab Rooms...');
    const lectureRooms = ['A1-309', 'A1-310', 'A1-311', 'A1-111', 'A1-213'];
    const labRooms = ['A1-204', 'A1-102', 'A1-306', 'A1-307', 'A1-314', 'A1-303', 'A1-216', 'A2-302', 'A2-303', 'A1-105'];

    for (const roomNum of lectureRooms) {
      await Room.create({ rNumber: roomNum, seatingCapacity: 100, roomType: 'LECTURE' }, { transaction });
    }
    for (const roomNum of labRooms) {
      await Room.create({ rNumber: roomNum, seatingCapacity: 25, roomType: 'LAB' }, { transaction });
    }

    // 6. Create Courses and map teachers many-to-many link
    console.log('📦 Seeding Courses...');
    
    // Theory Courses
    const ai = await Course.create({ courseNumber: 'AI', courseName: 'Artificial Intelligence', maxNumbStudents: 88, courseType: 'LECTURE', isElective: false }, { transaction });
    const dsbda = await Course.create({ courseNumber: 'DSBDA', courseName: 'Data Science & Big Data Analytics', maxNumbStudents: 88, courseType: 'LECTURE', isElective: false }, { transaction });
    const wt = await Course.create({ courseNumber: 'WT', courseName: 'Web Technology', maxNumbStudents: 88, courseType: 'LECTURE', isElective: false }, { transaction });

    // Lab Courses
    const dsbdal = await Course.create({ courseNumber: 'DSBDAL', courseName: 'DSBDA Lab', maxNumbStudents: 22, courseType: 'LAB', isElective: false }, { transaction });
    const lpii = await Course.create({ courseNumber: 'LPII', courseName: 'LP-II Lab', maxNumbStudents: 22, courseType: 'LAB', isElective: false }, { transaction });
    const wtl = await Course.create({ courseNumber: 'WTL', courseName: 'WT Lab', maxNumbStudents: 22, courseType: 'LAB', isElective: false }, { transaction });

    // Elective Courses
    const cc = await Course.create({ courseNumber: 'CC', courseName: 'Cloud Computing', maxNumbStudents: 88, courseType: 'LECTURE', isElective: true }, { transaction });
    const is_ = await Course.create({ courseNumber: 'IS', courseName: 'Information Security', maxNumbStudents: 88, courseType: 'LECTURE', isElective: true }, { transaction });

    // Helper to insert join table rows for course instructors
    const seedCourseInstructors = async (courseNumber, uids) => {
      for (const uid of uids) {
        const inst = instructors[uid];
        await sequelize.query(
          'INSERT INTO course_instructors (course_number, instructor_id) VALUES (?, ?)',
          { replacements: [courseNumber, inst.id], transaction }
        );
      }
    };

    await seedCourseInstructors('AI', ['T001', 'T004']);
    await seedCourseInstructors('DSBDA', ['T002', 'T005']);
    await seedCourseInstructors('WT', ['T003', 'T006']);
    await seedCourseInstructors('DSBDAL', ['T002', 'T005', 'T008', 'T011', 'T012', 'T016', 'T020']);
    await seedCourseInstructors('LPII', ['T001', 'T004', 'T009', 'T010', 'T013', 'T014', 'T017', 'T018', 'T019']);
    await seedCourseInstructors('WTL', ['T003', 'T006', 'T007', 'T015']);
    await seedCourseInstructors('CC', ['T009', 'T010']);
    await seedCourseInstructors('IS', ['T001', 'T014']);

    // 7. Create MeetingTimes
    console.log('📦 Seeding Meeting Times...');
    const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const lecTimes = ['08:45 - 09:45', '09:45 - 10:45', '11:00 - 12:00', '12:00 - 13:00', '13:45 - 14:45', '14:45 - 15:45'];
    
    // Lectures
    let lecIndex = 1;
    for (const day of DAYS) {
      for (const tString of lecTimes) {
        const pid = `L${String(lecIndex).padStart(3, '0')}`;
        await MeetingTime.create({ pid, time: tString, day, slotType: 'LECTURE' }, { transaction });
        lecIndex++;
      }
    }

    // Labs (2-Hour Slots)
    const labTimes = [
      { pid: 'B001', day: 'Monday', time: '08:45 - 10:45' },
      { pid: 'B002', day: 'Monday', time: '11:00 - 13:00' },
      { pid: 'B003', day: 'Monday', time: '13:45 - 15:45' },
      { pid: 'B004', day: 'Tuesday', time: '08:45 - 10:45' },
      { pid: 'B005', day: 'Tuesday', time: '11:00 - 13:00' },
      { pid: 'B006', day: 'Tuesday', time: '13:45 - 15:45' },
      { pid: 'B007', day: 'Wednesday', time: '08:45 - 10:45' },
      { pid: 'B008', day: 'Wednesday', time: '11:00 - 13:00' },
      { pid: 'B009', day: 'Wednesday', time: '13:45 - 15:45' },
      { pid: 'B010', day: 'Thursday', time: '08:45 - 10:45' },
      { pid: 'B011', day: 'Thursday', time: '11:00 - 13:00' },
      { pid: 'B012', day: 'Thursday', time: '13:45 - 15:45' },
      { pid: 'B013', day: 'Friday', time: '08:45 - 10:45' },
      { pid: 'B014', day: 'Friday', time: '11:00 - 13:00' },
      { pid: 'B015', day: 'Friday', time: '13:45 - 15:45' }
    ];
    for (const slot of labTimes) {
      await MeetingTime.create({ pid: slot.pid, time: slot.time, day: slot.day, slotType: 'LAB' }, { transaction });
    }

    // Electives (2-Hour Lecture slots prefixed with 'E')
    const elecTimes = [
      { pid: 'E001', day: 'Monday', time: '08:45 - 10:45' },
      { pid: 'E002', day: 'Monday', time: '11:00 - 13:00' },
      { pid: 'E003', day: 'Monday', time: '13:45 - 15:45' },
      { pid: 'E004', day: 'Tuesday', time: '08:45 - 10:45' },
      { pid: 'E005', day: 'Tuesday', time: '11:00 - 13:00' },
      { pid: 'E006', day: 'Tuesday', time: '13:45 - 15:45' },
      { pid: 'E007', day: 'Wednesday', time: '08:45 - 10:45' },
      { pid: 'E008', day: 'Wednesday', time: '11:00 - 13:00' },
      { pid: 'E009', day: 'Wednesday', time: '13:45 - 15:45' },
      { pid: 'E010', day: 'Thursday', time: '08:45 - 10:45' },
      { pid: 'E011', day: 'Thursday', time: '11:00 - 13:00' },
      { pid: 'E012', day: 'Thursday', time: '13:45 - 15:45' },
      { pid: 'E013', day: 'Friday', time: '08:45 - 10:45' },
      { pid: 'E014', day: 'Friday', time: '11:00 - 13:00' },
      { pid: 'E015', day: 'Friday', time: '13:45 - 15:45' }
    ];
    for (const slot of elecTimes) {
      await MeetingTime.create({ pid: slot.pid, time: slot.time, day: slot.day, slotType: 'LECTURE' }, { transaction });
    }

    // 8. Create Sections
    console.log('📦 Seeding Section Configurations...');
    
    // Theory Sections mapping
    const divisions = [
      { name: 'TE-I', div: divTE1 },
      { name: 'TE-II', div: divTE2 },
      { name: 'TE-III', div: divTE3 },
      { name: 'TE-IV', div: divTE4 }
    ];

    for (const d of divisions) {
      // AI Section
      await Section.create({
        sectionId: `AI-${d.name}`,
        departmentId: dept.id,
        divisionId: d.div.id,
        courseNumber: 'AI',
        numClassInWeek: 3,
        isElective: false
      }, { transaction });

      // DSBDA Section
      await Section.create({
        sectionId: `DSBDA-${d.name}`,
        departmentId: dept.id,
        divisionId: d.div.id,
        courseNumber: 'DSBDA',
        numClassInWeek: 3,
        isElective: false
      }, { transaction });

      // WT Section
      await Section.create({
        sectionId: `WT-${d.name}`,
        departmentId: dept.id,
        divisionId: d.div.id,
        courseNumber: 'WT',
        numClassInWeek: 3,
        isElective: false
      }, { transaction });
    }

    // Elective Sections (CC and IS for group G1 and G2)
    const electiveData = [
      { sid: 'CC-G1', div: divTE1, course: 'CC', group: 'G1' },
      { sid: 'IS-G1', div: divTE1, course: 'IS', group: 'G1' },
      { sid: 'CC-G2', div: divTE3, course: 'CC', group: 'G2' },
      { sid: 'IS-G2', div: divTE3, course: 'IS', group: 'G2' }
    ];
    for (const el of electiveData) {
      await Section.create({
        sectionId: el.sid,
        departmentId: dept.id,
        divisionId: el.div.id,
        courseNumber: el.course,
        numClassInWeek: 2,
        isElective: true,
        electiveGroup: el.group
      }, { transaction });
    }

    // Lab Sections
    // For each division, maps DSBDAL (2 sessions), LPII (2 sessions), WTL (1 session) per batch
    const divBatches = {
      'TE1': batches.filter(b => b.batchName.endsWith('1')),
      'TE2': batches.filter(b => b.batchName.endsWith('2')),
      'TE3': batches.filter(b => b.batchName.endsWith('3')),
      'TE4': batches.filter(b => b.batchName.endsWith('4'))
    };

    for (const [keySuffix, batchList] of Object.entries(divBatches)) {
      for (const batchObj of batchList) {
        const bChar = batchObj.batchName[0]; // 'K', 'L', 'M', or 'N'
        
        // DSBDAL (2/wk)
        await Section.create({
          sectionId: `${keySuffix}-${bChar}-DSBDAL`,
          departmentId: dept.id,
          batchId: batchObj.id,
          courseNumber: 'DSBDAL',
          numClassInWeek: 2,
          isElective: false
        }, { transaction });

        // LPII (2/wk)
        await Section.create({
          sectionId: `${keySuffix}-${bChar}-LPII`,
          departmentId: dept.id,
          batchId: batchObj.id,
          courseNumber: 'LPII',
          numClassInWeek: 2,
          isElective: false
        }, { transaction });

        // WTL (1/wk)
        await Section.create({
          sectionId: `${keySuffix}-${bChar}-WTL`,
          departmentId: dept.id,
          batchId: batchObj.id,
          courseNumber: 'WTL',
          numClassInWeek: 1,
          isElective: false
        }, { transaction });
      }
    }

    // Seed default users if not already present
    console.log('👤 Seeding default users...');
    const hashedPassAditya = await bcrypt.hash('password', 10);
    const hashedPassAdmin = await bcrypt.hash('Aadi5055', 10);

    await User.findOrCreate({
      where: { username: 'aditya' },
      defaults: {
        email: 'aditya@example.com',
        password: hashedPassAditya
      },
      transaction
    });

    await User.findOrCreate({
      where: { username: 'admin' },
      defaults: {
        email: 'admin@example.com',
        password: hashedPassAdmin
      },
      transaction
    });

    await transaction.commit();
    console.log('🎉 PICT COLLEGE DEMO SCHEDULING WORKLOAD SEEDED SUCCESSFULLY!');
    process.exit(0);
  } catch (error) {
    await transaction.rollback();
    console.error('🔴 Seeding workload failed:', error);
    process.exit(1);
  }
}

seedData();
