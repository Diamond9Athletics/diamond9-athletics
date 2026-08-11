/**
 * Testimonials shown on the homepage.
 *
 * To add a testimonial, drop an entry in the array below and
 * redeploy. Leave the array empty to hide the section entirely.
 *
 * Example entry:
 *   {
 *     quote: "Wes changed my son's mechanics in three sessions. He picked up 4 mph and finally trusts his slider.",
 *     name: "Marcus J.",
 *     detail: "Parent of D9 pitcher · 2027 class",
 *   },
 */
export type Testimonial = {
  quote: string;
  name: string;
  detail?: string;
};

export const testimonials: Testimonial[] = [];
