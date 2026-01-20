/**
 * CV Parser Service
 * AI-powered CV/Resume parsing for employee onboarding
 * Extracts: Personal info, Education, Experience, Skills, Certifications
 */

const Anthropic = require('@anthropic-ai/sdk');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const anthropic = new Anthropic();

/**
 * Parse CV text using AI and extract structured data
 * @param {string} cvText - Raw CV text content
 * @param {string} employeeId - Employee ID to associate parsed data with
 * @returns {Object} Parsed CV data with all extracted information
 */
async function parseCV(cvText, employeeId = null) {
    const systemPrompt = `You are an expert CV/Resume parser. Extract structured information from the CV text provided.
Return a JSON object with the following structure (use null for missing information):

{
    "personalInfo": {
        "name": "Full name",
        "email": "Email address",
        "phone": "Phone number",
        "linkedIn": "LinkedIn URL if present",
        "location": {
            "city": "City",
            "country": "Country",
            "address": "Full address if available"
        },
        "nationality": "Nationality if mentioned",
        "dateOfBirth": "Date of birth if mentioned (YYYY-MM-DD format)"
    },
    "summary": "Professional summary/objective if present",
    "education": [
        {
            "institution": "University/School name",
            "degree": "Degree type (Bachelor's, Master's, PhD, Diploma, etc.)",
            "fieldOfStudy": "Major/Field of study",
            "startDate": "Start date (YYYY-MM format)",
            "endDate": "End date or 'Present' (YYYY-MM format)",
            "grade": "GPA or grade if mentioned",
            "achievements": "Notable achievements, honors, awards"
        }
    ],
    "experience": [
        {
            "companyName": "Company name",
            "jobTitle": "Job title",
            "department": "Department if mentioned",
            "location": "Job location",
            "startDate": "Start date (YYYY-MM format)",
            "endDate": "End date or 'Present' (YYYY-MM format)",
            "isCurrent": true/false,
            "description": "Job description/responsibilities",
            "achievements": "Key achievements in this role",
            "skills": ["Skills used in this role"]
        }
    ],
    "skills": [
        {
            "name": "Skill name",
            "category": "technical/soft/language/certification",
            "proficiency": "beginner/intermediate/advanced/expert",
            "yearsOfExp": 0
        }
    ],
    "certifications": [
        {
            "name": "Certification name",
            "issuer": "Issuing organization",
            "date": "Date obtained (YYYY-MM format)",
            "expiryDate": "Expiry date if applicable",
            "credentialId": "Credential ID if mentioned"
        }
    ],
    "languages": [
        {
            "language": "Language name",
            "proficiency": "native/fluent/professional/intermediate/beginner"
        }
    ],
    "totalYearsOfExperience": 0,
    "highestEducation": "Highest degree obtained",
    "keyStrengths": ["List of 3-5 key strengths identified"],
    "industryExperience": ["Industries the candidate has worked in"]
}

Important:
- Be thorough and extract ALL information present
- Use consistent date formats (YYYY-MM)
- Categorize skills appropriately
- Calculate total years of experience accurately
- Identify the highest education level`;

    try {
        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4096,
            system: systemPrompt,
            messages: [{
                role: 'user',
                content: `Parse the following CV/Resume and extract all information:\n\n${cvText}`
            }]
        });

        const content = response.content[0]?.text || '';

        // Extract JSON from response
        let parsedData;
        try {
            // Try to find JSON in the response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                parsedData = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('No JSON found in response');
            }
        } catch (parseError) {
            console.error('Failed to parse CV response as JSON:', parseError);
            return {
                success: false,
                error: 'Failed to parse CV data',
                rawResponse: content
            };
        }

        // If employee ID provided, save the parsed data to database
        if (employeeId) {
            await saveParsedCVToDatabase(employeeId, parsedData);
        }

        return {
            success: true,
            data: parsedData,
            parsedAt: new Date().toISOString()
        };

    } catch (error) {
        console.error('CV parsing error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Save parsed CV data to database for an employee
 * @param {string} employeeId - Employee ID
 * @param {Object} parsedData - Parsed CV data
 */
async function saveParsedCVToDatabase(employeeId, parsedData) {
    const { personalInfo, education, experience, skills, certifications, languages } = parsedData;

    try {
        // Update employee with personal info
        const employeeUpdate = {};
        if (personalInfo) {
            if (personalInfo.phone) employeeUpdate.phone = personalInfo.phone;
            if (personalInfo.linkedIn) employeeUpdate.linkedIn = personalInfo.linkedIn;
            if (personalInfo.nationality) employeeUpdate.nationality = personalInfo.nationality;
            if (personalInfo.location?.city) employeeUpdate.city = personalInfo.location.city;
            if (personalInfo.location?.country) employeeUpdate.country = personalInfo.location.country;
            if (personalInfo.location?.address) employeeUpdate.address = personalInfo.location.address;
            if (personalInfo.dateOfBirth) {
                try {
                    employeeUpdate.dateOfBirth = new Date(personalInfo.dateOfBirth);
                } catch {}
            }
        }

        // Store full CV data as JSON
        employeeUpdate.cvData = JSON.stringify(parsedData);
        employeeUpdate.cvParsedAt = new Date();

        await prisma.employee.update({
            where: { id: employeeId },
            data: employeeUpdate
        });

        // Save education records
        if (education && education.length > 0) {
            for (const edu of education) {
                await prisma.employeeEducation.create({
                    data: {
                        employee_id: employeeId,
                        institution: edu.institution || 'Unknown',
                        degree: edu.degree || 'Unknown',
                        fieldOfStudy: edu.fieldOfStudy || 'Unknown',
                        startDate: edu.startDate ? new Date(edu.startDate) : null,
                        endDate: edu.endDate && edu.endDate !== 'Present' ? new Date(edu.endDate) : null,
                        grade: edu.grade,
                        achievements: edu.achievements,
                        isHighest: edu.degree === parsedData.highestEducation,
                        source: 'cv_parsed'
                    }
                });
            }
        }

        // Save experience records
        if (experience && experience.length > 0) {
            for (const exp of experience) {
                await prisma.employeeExperience.create({
                    data: {
                        employee_id: employeeId,
                        companyName: exp.companyName || 'Unknown',
                        jobTitle: exp.jobTitle || 'Unknown',
                        department: exp.department,
                        location: exp.location,
                        startDate: exp.startDate ? new Date(exp.startDate) : new Date(),
                        endDate: exp.endDate && exp.endDate !== 'Present' ? new Date(exp.endDate) : null,
                        isCurrent: exp.isCurrent || false,
                        description: exp.description,
                        achievements: exp.achievements,
                        skills: exp.skills ? JSON.stringify(exp.skills) : null,
                        source: 'cv_parsed'
                    }
                });
            }
        }

        // Save skills
        if (skills && skills.length > 0) {
            for (const skill of skills) {
                await prisma.employeeSkill.upsert({
                    where: {
                        employee_id_skillName: {
                            employee_id: employeeId,
                            skillName: skill.name
                        }
                    },
                    update: {
                        proficiency: skill.proficiency || 'intermediate',
                        yearsOfExp: skill.yearsOfExp,
                        source: 'cv_parsed'
                    },
                    create: {
                        employee_id: employeeId,
                        skillName: skill.name,
                        category: skill.category || 'technical',
                        proficiency: skill.proficiency || 'intermediate',
                        yearsOfExp: skill.yearsOfExp,
                        source: 'cv_parsed'
                    }
                });
            }
        }

        // Save languages as skills
        if (languages && languages.length > 0) {
            for (const lang of languages) {
                const proficiencyMap = {
                    'native': 'expert',
                    'fluent': 'expert',
                    'professional': 'advanced',
                    'intermediate': 'intermediate',
                    'beginner': 'beginner'
                };

                await prisma.employeeSkill.upsert({
                    where: {
                        employee_id_skillName: {
                            employee_id: employeeId,
                            skillName: lang.language
                        }
                    },
                    update: {
                        proficiency: proficiencyMap[lang.proficiency] || 'intermediate',
                        source: 'cv_parsed'
                    },
                    create: {
                        employee_id: employeeId,
                        skillName: lang.language,
                        category: 'language',
                        proficiency: proficiencyMap[lang.proficiency] || 'intermediate',
                        source: 'cv_parsed'
                    }
                });
            }
        }

        // Save certifications as skills
        if (certifications && certifications.length > 0) {
            for (const cert of certifications) {
                await prisma.employeeSkill.upsert({
                    where: {
                        employee_id_skillName: {
                            employee_id: employeeId,
                            skillName: cert.name
                        }
                    },
                    update: {
                        proficiency: 'expert',
                        source: 'cv_parsed'
                    },
                    create: {
                        employee_id: employeeId,
                        skillName: cert.name,
                        category: 'certification',
                        proficiency: 'expert',
                        source: 'cv_parsed'
                    }
                });
            }
        }

        console.log(`CV data saved for employee ${employeeId}`);
        return true;

    } catch (error) {
        console.error('Error saving CV data to database:', error);
        throw error;
    }
}

/**
 * Generate AI summary of an employee profile based on all available data
 * @param {string} employeeId - Employee ID
 * @returns {Object} AI-generated profile summary
 */
async function generateEmployeeProfileSummary(employeeId) {
    try {
        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
            include: {
                department: true,
                role: true,
                skills: true,
                education: true,
                experience: true,
                manager: true
            }
        });

        if (!employee) {
            return { success: false, error: 'Employee not found' };
        }

        const profileData = {
            name: employee.name,
            jobTitle: employee.jobTitle || employee.role?.name,
            department: employee.department?.name,
            hireDate: employee.hire_date,
            education: employee.education.map(e => ({
                degree: e.degree,
                field: e.fieldOfStudy,
                institution: e.institution
            })),
            experience: employee.experience.map(e => ({
                company: e.companyName,
                title: e.jobTitle,
                duration: e.startDate ? `${e.startDate.getFullYear()} - ${e.endDate ? e.endDate.getFullYear() : 'Present'}` : 'N/A'
            })),
            skills: employee.skills.map(s => ({
                name: s.skillName,
                level: s.proficiency
            })),
            performanceScore: employee.performanceScore,
            probationStatus: employee.probationStatus
        };

        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            system: `You are an HR analytics assistant. Generate a concise professional summary for an employee based on their profile data.
The summary should be 2-3 paragraphs covering:
1. Professional background and qualifications
2. Key skills and expertise areas
3. Career trajectory and potential

Be objective and professional.`,
            messages: [{
                role: 'user',
                content: `Generate a professional summary for this employee:\n${JSON.stringify(profileData, null, 2)}`
            }]
        });

        const summary = response.content[0]?.text || '';

        // Save summary to employee record
        await prisma.employee.update({
            where: { id: employeeId },
            data: {
                aiProfileSummary: summary,
                lastAnalyzedAt: new Date()
            }
        });

        return {
            success: true,
            summary,
            analyzedAt: new Date().toISOString()
        };

    } catch (error) {
        console.error('Error generating profile summary:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Compare CV skills with job requirements
 * @param {string} employeeId - Employee ID
 * @param {Array} requiredSkills - Array of required skill names
 * @returns {Object} Skills gap analysis
 */
async function analyzeSkillsGap(employeeId, requiredSkills) {
    try {
        const employeeSkills = await prisma.employeeSkill.findMany({
            where: { employee_id: employeeId }
        });

        const employeeSkillNames = employeeSkills.map(s => s.skillName.toLowerCase());

        const matchedSkills = [];
        const missingSkills = [];
        const partialMatches = [];

        for (const required of requiredSkills) {
            const requiredLower = required.toLowerCase();
            const exactMatch = employeeSkills.find(s => s.skillName.toLowerCase() === requiredLower);

            if (exactMatch) {
                matchedSkills.push({
                    skill: required,
                    employeeLevel: exactMatch.proficiency,
                    yearsOfExp: exactMatch.yearsOfExp
                });
            } else {
                // Check for partial matches
                const partial = employeeSkills.find(s =>
                    s.skillName.toLowerCase().includes(requiredLower) ||
                    requiredLower.includes(s.skillName.toLowerCase())
                );

                if (partial) {
                    partialMatches.push({
                        required,
                        similar: partial.skillName,
                        employeeLevel: partial.proficiency
                    });
                } else {
                    missingSkills.push(required);
                }
            }
        }

        const matchPercentage = Math.round(
            ((matchedSkills.length + partialMatches.length * 0.5) / requiredSkills.length) * 100
        );

        return {
            success: true,
            analysis: {
                matchPercentage,
                matchedSkills,
                partialMatches,
                missingSkills,
                totalRequired: requiredSkills.length,
                recommendation: matchPercentage >= 80 ? 'Strong match' :
                               matchPercentage >= 60 ? 'Good match with some training needed' :
                               matchPercentage >= 40 ? 'Moderate match - significant training required' :
                               'Weak match - may not be suitable'
            }
        };

    } catch (error) {
        console.error('Error analyzing skills gap:', error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    parseCV,
    saveParsedCVToDatabase,
    generateEmployeeProfileSummary,
    analyzeSkillsGap
};
