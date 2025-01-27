export default function HealthInfo() {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Health Information</h1>
        <ul className="space-y-4">
          <li>
            <a
              href="https://www.mayoclinic.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 underline"
            >
              Mayo Clinic
            </a>
          </li>
          <li>
            <a
              href="https://www.webmd.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 underline"
            >
              WebMD
            </a>
          </li>
          <li>
            <a
              href="https://www.who.int"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 underline"
            >
              World Health Organization (WHO)
            </a>
          </li>
        </ul>
      </div>
    );
  }
  