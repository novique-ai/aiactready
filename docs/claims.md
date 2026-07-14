# Landing-page claims audit

Source-of-truth dossier: `../x-prize/nights/2026-07-06/round-2/research/eu-ai-act-compliance-assessment.md`  
Red-team verdict: `../x-prize/nights/2026-07-06/round-2/verdicts/eu-ai-act-compliance-assessment.md`

Campaign copy is loaded from `config/campaign.yaml`; this file audits every factual marketing claim rendered by `app/page.tsx`.

| Rendered claim | Dossier evidence | Public source |
|---|---|---|
| The offer is fixed-fee, self-service, and requires no sales call. | Dossier lines 55-57, wedge. | Dossier synthesis of the market gap. |
| The initial ICP is a 10-50 employee SaaS team selling into Europe. | Dossier line 55. | Dossier synthesis of the underserved segment. |
| August 2026 is the enforcement deadline used for campaign urgency. | Dossier line 57. | Dossier statement; this funnel does not independently broaden the deadline claim. |
| Quick classification is a one-time offer and the configured entry price is the dossier price. | Dossier lines 9 and 70. | Dossier offer definition. |
| Full assessment includes Annex IV documentation support and audit preparation at the dossier price. | Dossier lines 9 and 71. | Dossier offer definition. |
| Monitoring is listed at the dossier monthly price and only after assessment; it has no v1 checkout. | Dossier lines 9 and 72; open question at lines 167-170 says deliverables remain undefined. | Dossier offer definition and limitation. |
| Founders report customers sending detailed compliance questionnaires. | Dossier line 23. | https://www.reddit.com/r/Entrepreneurs/comments/1rmgtnn/got_our_first_eu_customer_asking_about_ai_act/ |
| A cited survey reports 73% of European SMEs cannot determine whether their AI systems are high-risk. | Dossier line 29. | https://www.linkedin.com/pulse/title-eu-ai-act-compliance-smes-2026-risk-framework-dr-hernani-costa-gxoae |
| Published startup cost estimates are above the funnel's fixed-fee entry point. | Dossier lines 31 and 65-74. | https://wavect.io/blog/eu-ai-act-compliance-cost-startup/ |
| Technical documentation support is not legal advice; no regulatory opinions are provided; high-risk systems may need specialists. | Verdict lines 85-91. | Red-team constraint, not a performance claim. |

Implementation-state statements such as "test mode," "no live charge," and "no checkout in validation v1" are enforced by code and configuration rather than external evidence: `lib/stripe.ts` rejects non-test secret keys, `app/api/stripe/webhook/route.ts` rejects live events, and the monitoring tier has `purchasable: false` in `config/campaign.yaml`.
