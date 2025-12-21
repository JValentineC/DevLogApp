-- Seed Dummy Users with Roles and Posts
-- Run this after connecting to MySQL: mysql -h devlogs.db -u jvc -p devlogs < seed-dummy-users.sql

USE devlogs;

-- Note: role column already exists in User table
-- Skipping ALTER TABLE to avoid duplicate column error

-- Insert 5 dummy users with hashed passwords (password: 'password123' - bcrypt hash)
-- 1. Super Admin User
INSERT INTO `User` (firstName, middleName, lastName, email, password, username, role, bio, createdAt, updatedAt)
VALUES (
  'Sarah',
  'Marie',
  'Johnson',
  'sarah.johnson@icstars.org',
  '$2b$10$rQZx5K8p5GzYvL3qW9XxJeYH5tQ3xN2kL7mR4sP6tU8vW0xY1zA2B',
  'sjohnson',
  'super_admin',
  'Tech leader and mentor with 15+ years in software development. Passionate about empowering the next generation of tech professionals. Former Senior Architect at Microsoft.',
  NOW(),
  NOW()
);

-- 2. Admin User
INSERT INTO `User` (firstName, middleName, lastName, email, password, username, role, bio, createdAt, updatedAt)
VALUES (
  'Michael',
  'David',
  'Chen',
  'michael.chen@icstars.org',
  '$2b$10$rQZx5K8p5GzYvL3qW9XxJeYH5tQ3xN2kL7mR4sP6tU8vW0xY1zA2B',
  'mchen',
  'admin',
  'Full-stack developer and iC* Stars program coordinator. Love helping students navigate their tech journey. Specializing in React, Node.js, and cloud architecture.',
  NOW(),
  NOW()
);

-- 3. Regular User 1
INSERT INTO `User` (firstName, middleName, lastName, email, password, username, role, bio, createdAt, updatedAt)
VALUES (
  'Jessica',
  NULL,
  'Williams',
  'jessica.williams@icstars.org',
  '$2b$10$rQZx5K8p5GzYvL3qW9XxJeYH5tQ3xN2kL7mR4sP6tU8vW0xY1zA2B',
  'jwilliams',
  'user',
  'Aspiring software engineer currently in Cycle 52. Excited about web development and AI. Background in business administration, transitioning to tech.',
  NOW(),
  NOW()
);

-- 4. Regular User 2
INSERT INTO `User` (firstName, middleName, lastName, email, password, username, role, bio, createdAt, updatedAt)
VALUES (
  'James',
  'Alexander',
  'Rodriguez',
  'james.rodriguez@icstars.org',
  '$2b$10$rQZx5K8p5GzYvL3qW9XxJeYH5tQ3xN2kL7mR4sP6tU8vW0xY1zA2B',
  'jrodriguez',
  'user',
  'Data enthusiast learning Python and SQL. Cycle 51 graduate now working as a junior analyst. Love solving problems with code and visualization.',
  NOW(),
  NOW()
);

-- 5. Regular User 3
INSERT INTO `User` (firstName, middleName, lastName, email, password, username, role, bio, createdAt, updatedAt)
VALUES (
  'Amanda',
  'Grace',
  'Taylor',
  'amanda.taylor@icstars.org',
  '$2b$10$rQZx5K8p5GzYvL3qW9XxJeYH5tQ3xN2kL7mR4sP6tU8vW0xY1zA2B',
  'ataylor',
  'user',
  'Front-end developer in training. Passionate about creating beautiful and accessible user interfaces. Currently learning React and TypeScript in Cycle 52.',
  NOW(),
  NOW()
);

-- Create DevLog posts for each user
-- Post 1: Super Admin (Sarah Johnson)
INSERT INTO `DevLog` (title, content, createdBy, isPublished, createdAt, updatedAt)
VALUES (
  'Welcome to the New DevLog Platform',
  'Hello everyone! I''m excited to announce the launch of our new DevLog platform. This space is designed to help you document your learning journey, share your progress, and connect with fellow iC* Stars members.

**Key Features:**
- Create and publish development logs
- Track your technical progress
- Share code snippets and projects
- Connect with mentors and peers

Whether you''re just starting your tech journey or are a seasoned professional, this platform is here to support your growth. Happy coding!',
  1,
  1,
  NOW(),
  NOW()
);

-- Post 2: Admin (Michael Chen)
INSERT INTO `DevLog` (title, content, createdBy, isPublished, createdAt, updatedAt)
VALUES (
  'Building My First React App',
  'Today I built my first React application from scratch! Here''s what I learned:

**Setup Process:**
- Used Vite for faster development
- Configured ESLint and Prettier
- Set up component structure

**Key Takeaways:**
1. Components should be small and focused
2. Props make components reusable
3. useState hook is powerful for managing state

```jsx
const [count, setCount] = useState(0);
```

The React documentation is excellent. I recommend reading it thoroughly before diving into projects. Next up: learning about useEffect and API calls!',
  2,
  1,
  NOW(),
  NOW()
);

-- Post 3: Regular User 1 (Jessica Williams)
INSERT INTO `DevLog` (title, content, createdBy, isPublished, createdAt, updatedAt)
VALUES (
  'Week 3: HTML & CSS Fundamentals',
  'This week we dove deep into HTML and CSS. Coming from a business background, I was nervous about coding, but I''m starting to see the patterns!

**What I Learned:**
- Semantic HTML elements (header, nav, article, footer)
- CSS Flexbox for layouts
- Responsive design with media queries
- Git basics for version control

**My First Project:**
Built a personal portfolio page with:
- Responsive navigation bar
- About section with my photo
- Skills grid using Flexbox
- Contact form

It''s not perfect, but I''m proud of what I created in just 3 weeks. The instructors have been incredibly supportive. On to JavaScript next week!',
  3,
  1,
  NOW(),
  NOW()
);

-- Post 4: Regular User 2 (James Rodriguez)
INSERT INTO `DevLog` (title, content, createdBy, isPublished, createdAt, updatedAt)
VALUES (
  'SQL Query Optimization Tips',
  'After 6 months of working with databases, here are my top SQL optimization tips:

**1. Use Indexes Wisely**
- Index columns used in WHERE, JOIN, and ORDER BY
- Don''t over-index (slows INSERT/UPDATE)

**2. Avoid SELECT ***
- Only query columns you need
- Reduces data transfer and memory usage

**3. Use EXPLAIN**
```sql
EXPLAIN SELECT * FROM users WHERE email = ''test@example.com'';
```

**4. Optimize JOIN Operations**
- Use INNER JOIN when possible
- Filter data before joining (WHERE before JOIN)

**5. Limit Results**
- Use LIMIT for pagination
- Consider cursor-based pagination for large datasets

These tips helped me reduce query time from 5 seconds to 200ms in our production database!',
  4,
  1,
  NOW(),
  NOW()
);

-- Post 5: Regular User 3 (Amanda Taylor)
INSERT INTO `DevLog` (title, content, createdBy, isPublished, createdAt, updatedAt)
VALUES (
  'Learning TypeScript: My Journey',
  'Started learning TypeScript this week after getting comfortable with JavaScript. Here''s why I''m loving it:

**Type Safety is Amazing**
```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

function greetUser(user: User) {
  return `Hello, ${user.name}!`;
}
```

**Benefits I''ve Found:**
- Catches errors before runtime
- Better IDE autocomplete
- Makes refactoring safer
- Self-documenting code

**Challenges:**
- Learning curve with generics
- Configuring tsconfig.json
- Understanding when to use ''any'' (spoiler: rarely!)

**Resources:**
- TypeScript Handbook (official docs)
- TypeScript Deep Dive by Basarat
- Practice on TypeScript playground

The initial setup was frustrating, but now I can''t imagine going back to plain JavaScript. The confidence TypeScript gives me is worth the extra syntax!',
  5,
  1,
  NOW(),
  NOW()
);

-- Display success message with created users
SELECT 'Dummy users and posts created successfully!' AS status;
SELECT id, username, CONCAT(firstName, ' ', lastName) AS name, email, role 
FROM `User` 
WHERE email LIKE '%@icstars.org' 
ORDER BY id DESC 
LIMIT 5;
