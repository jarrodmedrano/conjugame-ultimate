import { ContentPage, ContentSection, ContentList } from './content-page'

export function Privacy() {
  return (
    <ContentPage title="Privacy Policy" lastUpdated="March 6, 2026">
      <ContentSection title="Introduction">
        <p>
          Story Bible Ultimate (&quot;we&quot;, &quot;us&quot;, or
          &quot;our&quot;) is committed to protecting your personal information.
          This Privacy Policy explains how we collect, use, disclose, and
          safeguard your information when you use our service.
        </p>
      </ContentSection>

      <ContentSection title="Information We Collect">
        <p>We collect information you provide directly to us, including:</p>
        <ContentList
          items={[
            <>
              <span className="font-semibold text-gray-900 dark:text-white">
                Account information:
              </span>{' '}
              name, email address, and password when you register.
            </>,
            <>
              <span className="font-semibold text-gray-900 dark:text-white">
                Content:
              </span>{' '}
              stories, characters, locations, timelines, and other creative
              content you create or upload.
            </>,
            <>
              <span className="font-semibold text-gray-900 dark:text-white">
                Communications:
              </span>{' '}
              messages you send us through contact forms or support channels.
            </>,
            <>
              <span className="font-semibold text-gray-900 dark:text-white">
                Usage data:
              </span>{' '}
              information about how you interact with our service, including log
              data, device information, and cookies.
            </>,
          ]}
        />
      </ContentSection>

      <ContentSection title="How We Use Your Information">
        <p>We use the information we collect to:</p>
        <ContentList
          items={[
            'Provide, maintain, and improve our services.',
            'Process transactions and send related information.',
            'Send technical notices, updates, security alerts, and support messages.',
            'Respond to comments, questions, and requests for customer service.',
            'Monitor and analyze trends, usage, and activities to improve the service.',
            'Detect, investigate, and prevent fraudulent transactions and other illegal activities.',
          ]}
        />
      </ContentSection>

      <ContentSection title="Sharing of Information">
        <p>
          We do not sell, trade, or otherwise transfer your personally
          identifiable information to third parties, except as described below:
        </p>
        <ContentList
          items={[
            <>
              <span className="font-semibold text-gray-900 dark:text-white">
                Service providers:
              </span>{' '}
              We may share your information with third-party vendors who perform
              services on our behalf (e.g., hosting, payment processing,
              analytics).
            </>,
            <>
              <span className="font-semibold text-gray-900 dark:text-white">
                Legal requirements:
              </span>{' '}
              We may disclose your information if required by law or in response
              to valid legal process.
            </>,
            <>
              <span className="font-semibold text-gray-900 dark:text-white">
                Business transfers:
              </span>{' '}
              If we are involved in a merger, acquisition, or sale of assets,
              your information may be transferred as part of that transaction.
            </>,
          ]}
        />
      </ContentSection>

      <ContentSection title="Data Retention">
        <p>
          We retain your personal information for as long as your account is
          active or as needed to provide you services. You may request deletion
          of your account and associated data at any time by contacting us.
        </p>
      </ContentSection>

      <ContentSection title="Security">
        <p>
          We take reasonable measures to help protect information about you from
          loss, theft, misuse, unauthorized access, disclosure, alteration, and
          destruction. However, no internet or electronic storage system is 100%
          secure.
        </p>
      </ContentSection>

      <ContentSection title="Cookies">
        <p>
          We use cookies and similar tracking technologies to track activity on
          our service and hold certain information. You can instruct your
          browser to refuse all cookies or to indicate when a cookie is being
          sent.
        </p>
      </ContentSection>

      <ContentSection title="Your Rights">
        <p>
          Depending on your location, you may have certain rights regarding your
          personal information, including:
        </p>
        <ContentList
          items={[
            'The right to access your personal information.',
            'The right to correct inaccurate data.',
            'The right to request deletion of your data.',
            'The right to object to or restrict processing of your data.',
            'The right to data portability (receiving your data in a structured format).',
          ]}
        />
        <p>To exercise these rights, please contact us at the address below.</p>
      </ContentSection>

      <ContentSection title="Children's Privacy">
        <p>
          Our service is not directed to children under the age of 13. We do not
          knowingly collect personally identifiable information from children
          under 13. If we discover that a child under 13 has provided us with
          personal information, we will delete such information promptly.
        </p>
      </ContentSection>

      <ContentSection title="Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. We will notify
          you of any changes by posting the new policy on this page and updating
          the &quot;Last updated&quot; date. Continued use of the service after
          changes constitutes acceptance of the updated policy.
        </p>
      </ContentSection>

      <ContentSection title="Contact Us">
        <p>
          If you have any questions about this Privacy Policy, please reach out:
        </p>
        <p>
          <a
            href="/about/contact"
            className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            Contact us via our contact form &rarr;
          </a>
        </p>
      </ContentSection>
    </ContentPage>
  )
}
