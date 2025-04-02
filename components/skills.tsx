export function Skills() {
  const skills = [
    { category: "Office", items: ["Word", "Excel", "PowerPoint"] },
    { category: "Programming", items: ["Java", "JavaScript", "Logic Programming"] },
    { category: "Web Technologies", items: ["React", "Tailwind CSS", "NodeJS"] },
    { category: "Soft Skills", items: ["Process Management", "Organization", "Technical Support", "Customer Service"] },
  ]

  return (
    <section id="skills" className="py-24 px-4 md:px-6">
      <div className="container mx-auto max-w-3xl">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-12 text-center">Skills</h2>
        <div className="grid gap-12 md:grid-cols-2">
          {skills.map((skillGroup) => (
            <div key={skillGroup.category} className="space-y-4">
              <h3 className="text-2xl font-semibold">{skillGroup.category}</h3>
              <ul className="space-y-2">
                {skillGroup.items.map((skill) => (
                  <li key={skill} className="text-neutral-600 dark:text-neutral-300">
                    {skill}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

