function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// e.g. /athletes/lincoln-high-jordan-smith-baseball
export function athleteProfileSlug(input: {
  schoolName: string;
  firstName: string;
  lastName: string;
  sport: string;
}) {
  return [
    slugify(input.schoolName),
    slugify(`${input.firstName} ${input.lastName}`),
    slugify(input.sport),
  ]
    .filter(Boolean)
    .join('-');
}

export function organizationSlug(name: string) {
  return slugify(name);
}

export { slugify };
