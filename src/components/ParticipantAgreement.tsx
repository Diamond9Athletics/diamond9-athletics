import { WAIVER_VERSION_LABEL } from "@/lib/legal/waiver";

/**
 * The Participant Agreement text. Kept in sync with the "Diamond Nine
 * Athletics Participant Agreement" doc. Any wording change here must
 * bump WAIVER_VERSION in src/lib/legal/waiver.ts so everyone re-accepts.
 *
 * The release and indemnity stay in bold capitals: Texas only enforces
 * a release of a party's own negligence when it is conspicuous.
 */
export function ParticipantAgreement() {
  return (
    <div className="space-y-7 text-zinc-300 text-sm leading-relaxed">
      <div>
        <h2 className="font-display text-2xl sm:text-3xl text-white leading-tight">
          PARTICIPANT AGREEMENT, RELEASE OF LIABILITY &amp; EQUIPMENT RESPONSIBILITY
        </h2>
        <p className="text-zinc-500 text-xs tracking-wider mt-2">
          DIAMOND NINE ATHLETICS LLC · VERSION {WAIVER_VERSION_LABEL.toUpperCase()}
        </p>
      </div>

      <Section title="Important Notice">
        <Caps>
          READ THIS AGREEMENT CAREFULLY BEFORE ACCEPTING. IT AFFECTS YOUR LEGAL RIGHTS. BY
          ACCEPTING, YOU AGREE TO PAY FOR EQUIPMENT THE ATHLETE DAMAGES, YOU ACCEPT THE RISKS
          OF TRAINING, AND YOU GIVE UP THE RIGHT TO SUE DIAMOND NINE ATHLETICS LLC FOR
          INJURIES, INCLUDING INJURIES CAUSED BY ITS OWN NEGLIGENCE.
        </Caps>
        <p>
          This Agreement must be accepted before the Athlete&rsquo;s first session. If the
          Athlete is under 18, a parent or legal guardian must accept it. In this Agreement,
          &ldquo;I,&rdquo; &ldquo;me,&rdquo; and &ldquo;my&rdquo; mean the Athlete and, if
          the Athlete is under 18, the parent or guardian who accepts it, both personally and
          on behalf of the Athlete.
        </p>
      </Section>

      <Section title="1. Definitions">
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <Term>&ldquo;D9&rdquo;</Term> means Diamond Nine Athletics LLC.
          </li>
          <li>
            <Term>&ldquo;Released Parties&rdquo;</Term> means D9 and its owners, members,
            managers, coaches, trainers, employees, independent contractors, volunteers,
            successors, and assigns, and the owners and landlords of any facility D9 uses.
          </li>
          <li>
            <Term>&ldquo;Athlete&rdquo;</Term> means the person named on the D9 account under
            which this Agreement is accepted, who takes part in the Activities.
          </li>
          <li>
            <Term>&ldquo;Activities&rdquo;</Term> means all training and related activities
            offered by D9, including pitching, bullpens, catching, hitting, long toss,
            high-intent throwing, pulldowns, weighted-ball and plyo-ball drills, medicine-ball
            work, sprints, agility, mobility, strength and conditioning, video and data
            collection, and being present at the Facility before, during, or after a session.
          </li>
          <li>
            <Term>&ldquo;Equipment&rdquo;</Term> means all equipment, technology, and property
            owned, leased, or used by D9, including pitch-tracking units (such as Rapsodo),
            radar guns, cameras, phones, tablets, computers, pitching machines, mounds,
            L-screens, nets, cages, turf, targets, balls of every kind, weighted and plyo balls,
            medicine balls, bats, and the Facility&rsquo;s walls, doors, fixtures, and
            furnishings.
          </li>
          <li>
            <Term>&ldquo;Facility&rdquo;</Term> means any location where D9 provides
            Activities, including its training facility in the Austin, Texas area and any
            field, gym, or other site D9 uses.
          </li>
        </ul>
      </Section>

      <Section title="2. Assumption of Risk">
        <p>
          Baseball training carries a real risk of injury, including injuries that can end a
          season or a career. I understand and accept these risks, including:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            Being struck by thrown, batted, deflected, or rebounding balls, bats, or Equipment,
            which can cause broken bones, eye and dental injuries, and concussions.
          </li>
          <li>
            Arm injuries from throwing, including damage to the elbow (such as the UCL) and
            shoulder, which high-intent throwing, pulldowns, and weighted-ball or plyo-ball
            training can make more likely.
          </li>
          <li>
            Muscle strains and tears, sprains, dislocations, and fractures from throwing,
            sprinting, lifting, and agility work.
          </li>
          <li>Overexertion, dehydration, heat illness, fainting, and heart problems.</li>
          <li>Slips, trips, falls, and collisions with people, walls, nets, or Equipment.</li>
          <li>Equipment that breaks, malfunctions, or is used incorrectly by the Athlete or others.</li>
          <li>Serious injury, permanent disability, paralysis, and death.</li>
        </ul>
        <p>
          Some risks cannot be foreseen.{" "}
          <span className="font-bold text-white">
            I KNOWINGLY AND VOLUNTARILY ASSUME ALL RISKS OF THE ACTIVITIES, KNOWN AND UNKNOWN,
            INCLUDING RISKS ARISING FROM THE NEGLIGENCE OF THE RELEASED PARTIES.
          </span>
        </p>
      </Section>

      <Section title="3. Release and Waiver of Liability">
        <Caps>
          IN EXCHANGE FOR BEING ALLOWED TO TAKE PART IN THE ACTIVITIES, I RELEASE, WAIVE,
          DISCHARGE, AND AGREE NOT TO SUE THE RELEASED PARTIES FOR ANY AND ALL CLAIMS, DEMANDS,
          LOSSES, AND LIABILITY OF ANY KIND FOR INJURY, ILLNESS, DISABILITY, DEATH, OR PROPERTY
          DAMAGE ARISING OUT OF OR RELATED TO THE ACTIVITIES, THE FACILITY, OR THE EQUIPMENT.
        </Caps>
        <Caps>
          THIS RELEASE EXPRESSLY INCLUDES CLAIMS CAUSED IN WHOLE OR IN PART BY THE NEGLIGENCE OF
          THE RELEASED PARTIES. I INTEND TO RELEASE THE RELEASED PARTIES FROM THE CONSEQUENCES
          OF THEIR OWN NEGLIGENCE.
        </Caps>
        <p>
          This release applies to the fullest extent Texas law allows. It does not release
          claims for gross negligence or intentional misconduct.
        </p>
      </Section>

      <Section title="4. Indemnification">
        <Caps>
          I AGREE TO DEFEND, INDEMNIFY, AND HOLD HARMLESS THE RELEASED PARTIES FROM ANY AND ALL
          CLAIMS, LAWSUITS, LOSSES, COSTS, AND ATTORNEY&rsquo;S FEES ARISING OUT OF OR RELATED TO
          THE ATHLETE&rsquo;S PARTICIPATION IN THE ACTIVITIES, INCLUDING CLAIMS BROUGHT BY OR ON
          BEHALF OF THE ATHLETE (INCLUDING A MINOR ATHLETE) OR BY ANY OTHER PERSON, AND
          INCLUDING CLAIMS CAUSED IN WHOLE OR IN PART BY THE NEGLIGENCE OF THE RELEASED PARTIES.
        </Caps>
        <p>
          If the Athlete is under 18, the parent or guardian who accepts this Agreement makes
          this promise personally. If the Athlete, or anyone acting for the Athlete, brings a
          claim against the Released Parties, the parent or guardian will pay the Released
          Parties&rsquo; resulting costs, including their attorney&rsquo;s fees.
        </p>
      </Section>

      <Section title="5. Equipment Responsibility">
        <Caps>
          I AM FINANCIALLY RESPONSIBLE FOR ANY EQUIPMENT THE ATHLETE DAMAGES, DESTROYS, OR
          LOSES, WHETHER ON PURPOSE, THROUGH CARELESSNESS, OR BY ACCIDENT.
        </Caps>
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            <Term>What is covered.</Term> This includes damage caused by a ball the Athlete
            throws or hits, damage from using Equipment without permission or in a way a coach
            did not direct, and any Equipment the Athlete removes from the Facility.
          </li>
          <li>
            <Term>What is not covered.</Term> Normal wear and tear is D9&rsquo;s responsibility.
            Normal wear and tear means gradual deterioration from proper use, such as balls,
            nets, and turf wearing out over time. It does not include sudden damage, such as a
            broken camera, sensor, screen, or display.
          </li>
          <li>
            <Term>How the cost is set.</Term> I will pay D9&rsquo;s actual cost to repair the
            item. If it cannot reasonably be repaired, I will pay the current retail price of a
            comparable new replacement, plus shipping, tax, and installation. D9 will send me an
            itemized invoice with a receipt or written quote.
          </li>
          <li>
            <Term>When payment is due.</Term> Payment is due within 30 days after D9 sends the
            invoice by email or text. Until it is paid, D9 may suspend the Athlete&rsquo;s
            ability to book sessions. If the balance stays unpaid, I will also pay D9&rsquo;s
            reasonable collection costs and attorney&rsquo;s fees.
          </li>
          <li>
            <Term>High-value Equipment.</Term> Some Equipment, such as pitch-tracking units,
            radar guns, cameras, and tablets, costs thousands of dollars to replace. The Athlete
            will use it only where and how a coach directs, and will not touch, move, or adjust
            it without permission.
          </li>
          <li>
            <Term>Reporting damage.</Term> The Athlete will tell a coach right away about any
            damaged or malfunctioning Equipment and will not use it until a coach says it is
            safe.
          </li>
          <li>
            <Term>Minor Athletes.</Term> If the Athlete is under 18, the parent or guardian who
            accepts this Agreement is personally responsible for these payments.
          </li>
        </ol>
      </Section>

      <Section title="6. Health and Emergency Medical Care">
        <ul className="list-disc pl-5 space-y-2">
          <li>
            The Athlete is physically able to take part in the Activities. I have told D9 in
            writing about any injury, illness, or condition that could affect the Athlete&rsquo;s
            safety, and I will tell D9 if anything changes.
          </li>
          <li>
            I understand D9 recommends a physician&rsquo;s clearance before the Athlete starts
            any high-intent, weighted-ball, or velocity program.
          </li>
          <li>
            The Athlete will stop right away and tell a coach about any arm pain, dizziness,
            chest pain, or other warning sign.
          </li>
          <li>
            In an emergency, I authorize D9 to call emergency services and to arrange first aid
            and medical treatment for the Athlete if I cannot be reached. I am responsible for
            all costs of that care, including ambulance transport.
          </li>
          <li>
            D9 does not provide medical advice. Coaching, throwing programs, and arm-care plans
            are training guidance, not medical treatment.
          </li>
        </ul>
      </Section>

      <Section title="7. Rules, Supervision, and Personal Property">
        <ul className="list-disc pl-5 space-y-2">
          <li>
            The Athlete will follow coaches&rsquo; instructions, warm-up and throwing-program
            guidelines, and all posted Facility rules.
          </li>
          <li>
            The Athlete will train only during booked sessions or when a coach is present, and
            will throw and hit only in designated areas and directions.
          </li>
          <li>
            D9 may stop a session or refuse service if the Athlete&rsquo;s conduct is unsafe. No
            refund is owed for a session ended for unsafe conduct.
          </li>
          <li>Parents, siblings, and guests must stay out of active throwing and hitting areas.</li>
          <li>
            D9 is not responsible for lost, stolen, or damaged personal property, including
            bags, gloves, bats, phones, and vehicles.
          </li>
        </ul>
      </Section>

      <Section title="8. General Terms">
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <Term>Term.</Term> This Agreement covers every session and Activity, now and in the
            future, until I revoke it in writing. Revoking it ends the Athlete&rsquo;s
            participation.
          </li>
          <li>
            <Term>Governing law and venue.</Term> Texas law governs this Agreement. Any lawsuit
            related to it must be filed in the county where D9&rsquo;s Facility is located.
          </li>
          <li>
            <Term>Severability.</Term> If any part of this Agreement is found unenforceable,
            that part will be enforced to the greatest extent allowed, and the rest stays in
            effect.
          </li>
          <li>
            <Term>Entire agreement.</Term> This is the complete agreement on these subjects. It
            can be changed only in a writing signed by D9.
          </li>
          <li>
            <Term>Binding effect.</Term> This Agreement binds me and my heirs, executors,
            administrators, and assigns.
          </li>
          <li>
            <Term>Electronic signatures.</Term> An electronic signature or online acceptance has
            the same effect as a handwritten signature, and a copy is as valid as the original.
          </li>
        </ul>
      </Section>

      <Section title="9. Electronic Acceptance">
        <Caps>
          BY CHECKING THE BOX AND TAPPING ACKNOWLEDGE, I CONFIRM THAT I HAVE READ THIS ENTIRE
          AGREEMENT, UNDERSTAND IT, AND ACCEPT IT VOLUNTARILY. I UNDERSTAND THAT I AM GIVING UP
          SUBSTANTIAL LEGAL RIGHTS, INCLUDING THE RIGHT TO SUE THE RELEASED PARTIES FOR THEIR
          OWN NEGLIGENCE, AND THAT I AM AGREEING TO PAY FOR EQUIPMENT THE ATHLETE DAMAGES.
        </Caps>
        <ul className="list-disc pl-5 space-y-2">
          <li>My electronic acceptance is my signature and has the same effect as a handwritten signature.</li>
          <li>
            If I accept as a parent or legal guardian, I accept on my own behalf and on behalf of
            the Athlete, and I personally accept the payment and indemnity obligations in
            Sections 4 and 5.
          </li>
          <li>
            D9 keeps a record of each acceptance, including the date, time, version, and who
            accepted. This Agreement is always available at diamond9athletics.com/waiver.
          </li>
        </ul>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="font-display text-xl text-white tracking-wide">{title.toUpperCase()}</h3>
      {children}
    </section>
  );
}

function Caps({ children }: { children: React.ReactNode }) {
  return <p className="font-bold text-white">{children}</p>;
}

function Term({ children }: { children: React.ReactNode }) {
  return <span className="font-bold text-white">{children}</span>;
}
