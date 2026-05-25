import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { channelManager } from '../services/channelManager';
import PDFDocument from 'pdfkit';

// Maps DB column names (priceFrom/priceTo) to the frontend's expected names (priceMin/priceMax)
function toProjectDto(p: Record<string, unknown>) {
  const { priceFrom, priceTo, ...rest } = p;
  return { ...rest, priceMin: priceFrom ?? null, priceMax: priceTo ?? null };
}

export const builderController = {
  ensureBuilder: async (req: Request, res: Response) => {
    const { name, email, phone, userId } = req.body;
    
    let builder = await prisma.builder.findFirst({
      where: {
        OR: [
          { user: { email: email } },
          { userId: userId || -1 }
        ]
      },
      include: { user: true }
    });
    
    if (!builder) {
      // Create user first if not exists
      let user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: email },
            { phone: phone }
          ]
        }
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            phone: phone || `temp-${Date.now()}`,
            fullName: name,
            email: email,
            role: 'BUILDER'
          }
        });
      }

      builder = await prisma.builder.findUnique({
        where: { userId: user.id },
        include: { user: true }
      });

      if (!builder) {
        builder = await prisma.builder.create({
          data: {
            userId: user.id
          },
          include: { user: true }
        });
      }
    }
    
    res.json({ ok: true, data: { builderId: builder.id } });
  },

  createProject: async (req: Request, res: Response) => {
    const { builderId } = req.params;
    const projectData = req.body;

    const newProject = await prisma.project.create({
      data: {
        builderId: Number(builderId),
        name: projectData.name,
        city: projectData.city,
        description: projectData.description,
        address: projectData.address,
        totalUnits: projectData.totalUnits,
        availableUnits: projectData.availableUnits,
        bookedUnits: projectData.bookedUnits,
        soldUnits: projectData.soldUnits,
        reraNumber: projectData.reraNumber,
        reraExpiry: projectData.reraExpiry,
        priceFrom: projectData.priceMin ?? projectData.priceFrom,
        priceTo: projectData.priceMax ?? projectData.priceTo,
        commissionValue: projectData.commissionValue,
        featured: projectData.featured ?? false,
        closingSoon: projectData.closingSoon ?? false,
        possessionDate: projectData.possessionDate,
        published: projectData.published ?? true,
        status: projectData.status || 'ACTIVE',
        videoUrl: projectData.videoUrl || null,
      }
    });

    // Save the developer/company name on the Builder record when first provided
    if (projectData.builderName) {
      await prisma.builder.update({
        where: { id: Number(builderId) },
        data: { companyName: projectData.builderName },
      }).catch(() => {});
    }

    // Notify customers whose preferred city matches this project's city
    if (newProject.city) {
      const matchingCustomers = await prisma.user.findMany({
        where: {
          role: 'CUSTOMER',
          preferredCity: { equals: newProject.city, mode: 'insensitive' }
        }
      });

      if (matchingCustomers.length > 0) {
        const locality = projectData.locality ? `, ${projectData.locality}` : '';
        const notifTitle = 'New Project in Your City';
        const notifMessage = `"${newProject.name}"${locality} is now available in ${newProject.city}. Tap to explore!`;

        await Promise.all(
          matchingCustomers.map(customer =>
            Promise.all([
              prisma.deal.create({
                data: {
                  builderId: Number(builderId),
                  customerId: customer.id,
                  projectId: newProject.id,
                  status: 'New Lead'
                }
              }),
              prisma.notification.create({
                data: {
                  userId: customer.id,
                  title: notifTitle,
                  message: notifMessage,
                  type: 'info',
                  link: '/customer'
                }
              })
            ])
          )
        );

        // Push real-time event to every customer currently connected via SSE
        channelManager.publish(newProject.city, {
          type: 'new_project',
          title: notifTitle,
          message: notifMessage,
          projectId: newProject.id,
          city: newProject.city,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Notify all CPs about the new project in real-time
    const cpUsers = await prisma.user.findMany({ where: { role: 'CP' }, select: { id: true } });
    if (cpUsers.length > 0) {
      const locality    = projectData.locality ? `, ${projectData.locality}` : '';
      const cpTitle     = 'New Project Listed';
      const cpMessage   = `"${newProject.name}"${locality}, ${newProject.city ?? ''} is now on the marketplace.`;
      const cpTimestamp = new Date().toISOString();

      await Promise.all(
        cpUsers.map(cp =>
          prisma.notification.create({
            data: { userId: cp.id, title: cpTitle, message: cpMessage, type: 'info', link: '/cp/projects' },
          })
        )
      );

      cpUsers.forEach(cp =>
        channelManager.publish(`user:${cp.id}`, {
          type: 'new_project',
          title: cpTitle,
          message: cpMessage,
          projectId: newProject.id,
          city: newProject.city ?? '',
          link: `/cp/projects`,
          timestamp: cpTimestamp,
        })
      );
    }

    res.json({ ok: true, data: toProjectDto(newProject as unknown as Record<string, unknown>) });
  },

  getProjects: async (req: Request, res: Response) => {
    const { builderId } = req.params;
    const { status } = req.query;

    const projects = await prisma.project.findMany({
      where: {
        builderId: Number(builderId),
        ...(status ? { status: status as string } : {})
      }
    });

    res.json({ ok: true, data: projects.map(p => toProjectDto(p as unknown as Record<string, unknown>)) });
  },

  getProject: async (req: Request, res: Response) => {
    const { projectId } = req.params;
    const project = await prisma.project.findUnique({
      where: { id: Number(projectId) }
    });

    if (project) {
      res.json({ ok: true, data: toProjectDto(project as unknown as Record<string, unknown>) });
    } else {
      res.status(404).json({ ok: false, message: 'Project not found' });
    }
  },

  updateProject: async (req: Request, res: Response) => {
    const { projectId } = req.params;
    const b = req.body;

    const data: Record<string, unknown> = {};
    if (b.description    !== undefined) data.description    = b.description;
    if (b.possessionDate !== undefined) data.possessionDate = b.possessionDate;
    if (b.status         !== undefined) data.status         = b.status;
    if (b.published      !== undefined) data.published      = b.published;
    if (b.featured       !== undefined) data.featured       = b.featured;
    if (b.closingSoon    !== undefined) data.closingSoon    = b.closingSoon;
    if (b.totalUnits     !== undefined) data.totalUnits     = b.totalUnits;
    if (b.availableUnits !== undefined) data.availableUnits = b.availableUnits;
    if (b.bookedUnits    !== undefined) data.bookedUnits    = b.bookedUnits;
    if (b.soldUnits      !== undefined) data.soldUnits      = b.soldUnits;
    if (b.priceMin       !== undefined) data.priceFrom      = b.priceMin;
    if (b.priceMax       !== undefined) data.priceTo        = b.priceMax;
    if (b.commissionValue !== undefined) data.commissionValue = b.commissionValue;
    if (b.imageUrl       !== undefined) data.imageUrl        = b.imageUrl;
    if (b.coverUrl       !== undefined) data.imageUrl        = b.coverUrl;
    if (b.videoUrl       !== undefined) data.videoUrl        = b.videoUrl;

    try {
      const updatedProject = await prisma.project.update({
        where: { id: Number(projectId) },
        data,
      });
      res.json({ ok: true, data: toProjectDto(updatedProject as unknown as Record<string, unknown>) });
    } catch (error) {
      res.status(404).json({ ok: false, message: 'Project not found' });
    }
  },

  getBuilderLeads: async (req: Request, res: Response) => {
    const { builderId } = req.params;
    const deals = await prisma.deal.findMany({
      where: { builderId: Number(builderId) },
      include: {
        customer: { select: { fullName: true, phone: true, email: true } },
        project:  { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    const leads = deals.map(d => ({
      id:           String(d.id),
      customerName: d.customer?.fullName ?? 'Unknown',
      phone:        d.customer?.phone ?? '',
      email:        d.customer?.email ?? '',
      projectId:    String(d.projectId),
      projectName:  d.project?.name ?? '',
      unitType:     '',
      cpId:         '',
      cpName:       '',
      budget:       d.dealValue ?? 0,
      stage:        d.status,
      notes:        '',
      source:       '',
      createdAt:    d.createdAt.toISOString().split('T')[0],
      daysInStage:  Math.floor((Date.now() - new Date(d.updatedAt).getTime()) / 86_400_000),
    }));
    res.json({ ok: true, data: leads });
  },

  updateLeadStage: async (req: Request, res: Response) => {
    const { dealId } = req.params;
    const { stage } = req.body;
    try {
      const updated = await prisma.deal.update({
        where: { id: Number(dealId) },
        data:  { status: stage },
      });
      res.json({ ok: true, data: { id: String(updated.id), stage: updated.status } });
    } catch {
      res.status(404).json({ ok: false, message: 'Deal not found' });
    }
  },

  getBuilderCommissions: async (req: Request, res: Response) => {
    const { builderId } = req.params;
    const deals = await prisma.deal.findMany({
      where: { builderId: Number(builderId) },
      include: {
        customer: { select: { fullName: true } },
        project:  { select: { name: true, commissionValue: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    const commissions = deals
      .filter(d => d.dealValue != null)
      .map(d => {
        const pct    = d.project?.commissionValue ?? 0;
        const amount = d.dealValue! * pct / 100;
        return {
          id:                String(d.id),
          cpId:              '',
          cpName:            '',
          projectId:         String(d.projectId),
          projectName:       d.project?.name ?? '',
          unit:              '',
          customerName:      d.customer?.fullName ?? 'Unknown',
          saleValue:         d.dealValue!,
          commissionPercent: pct,
          amount,
          status:            (d.commissionStatus ?? 'Pending') as 'Pending' | 'Processing' | 'Released',
          expectedDate:      '',
          releasedDate:      d.commissionReleasedAt?.toISOString().split('T')[0],
        };
      });
    res.json({ ok: true, data: commissions });
  },

  releaseBuilderCommission: async (req: Request, res: Response) => {
    const { dealId } = req.params;
    try {
      const updated = await prisma.deal.update({
        where: { id: Number(dealId) },
        data:  { commissionStatus: 'Released', commissionReleasedAt: new Date() },
      });
      res.json({ ok: true, data: {
        id:          String(updated.id),
        status:      updated.commissionStatus,
        releasedDate: updated.commissionReleasedAt?.toISOString().split('T')[0],
      }});
    } catch {
      res.status(404).json({ ok: false, message: 'Deal not found' });
    }
  },

  updateDealStatus: async (req: Request, res: Response) => {
    const { builderId, dealId } = req.params;
    const { status } = req.body;
    try {
      const updated = await prisma.deal.update({
        where: { id: Number(dealId), builderId: Number(builderId) },
        data:  { status },
      });
      res.json({ ok: true, data: { id: String(updated.id), status: updated.status } });
    } catch {
      res.status(404).json({ ok: false, message: 'Deal not found' });
    }
  },

  getDocuments: async (req: Request, res: Response) => {
    const { projectId } = req.params;
    const docs = await prisma.document.findMany({
      where: { projectId: Number(projectId) },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ ok: true, data: docs.map(d => ({
      id: d.id,
      docType: d.docType,
      fileName: d.name,
      fileUrl: d.url,
      uploadedAt: d.createdAt.toISOString(),
    })) });
  },

  uploadDocument: async (req: Request, res: Response) => {
    const { projectId } = req.params;
    const file = (req as any).file as Express.Multer.File | undefined;
    const { docType } = req.body;
    if (!file) {
      res.status(400).json({ ok: false, message: 'No file uploaded' });
      return;
    }
    const url = `${req.protocol}://${req.get('host')}/uploads/project-docs/${file.filename}`;
    const doc = await prisma.document.create({
      data: {
        projectId: Number(projectId),
        name:      file.originalname,
        url,
        docType:   docType || 'Other',
      },
    });
    res.json({ ok: true, data: {
      id: doc.id,
      docType: doc.docType,
      fileName: doc.name,
      fileUrl: doc.url,
      uploadedAt: doc.createdAt.toISOString(),
    }});
  },

  uploadProjectImage: async (req: Request, res: Response) => {
    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) {
      res.status(400).json({ ok: false, message: 'No file uploaded' });
      return;
    }
    const url = `${req.protocol}://${req.get('host')}/uploads/project-images/${file.filename}`;
    res.json({ ok: true, data: url });
  },

  getPublicProjects: async (req: Request, res: Response) => {
    const { city, builderId } = req.query;

    const projects = await prisma.project.findMany({
      where: {
        published: true,
        ...(city ? { city: { equals: city as string, mode: 'insensitive' } } : {}),
        ...(builderId ? { builderId: Number(builderId) } : {}),
      },
      include: { builder: { select: { companyName: true, user: { select: { fullName: true } } } } },
    });

    res.json({
      ok: true,
      data: projects.map(p => {
        const { priceFrom, priceTo, builder, ...rest } = p as any;
        return {
          ...rest,
          priceMin: priceFrom ?? null,
          priceMax: priceTo ?? null,
          builderName: builder?.companyName || builder?.user?.fullName || null,
        };
      }),
    });
  },

  getPublicBuilders: async (_req: Request, res: Response) => {
    const builders = await prisma.builder.findMany({
      where: { projects: { some: { published: true } } },
      select: {
        id: true,
        companyName: true,
        user: { select: { fullName: true } },
        _count: { select: { projects: { where: { published: true } } } },
      },
    });

    res.json({
      ok: true,
      data: builders
        .filter(b => b.companyName || b.user?.fullName)
        .map(b => ({
          id: b.id,
          name: b.companyName || b.user?.fullName || 'Builder',
          projectCount: b._count.projects,
        })),
    });
  },

  // Portal (Meeting) interactions
  bookMeeting: async (req: Request, res: Response) => {
    const meetingData = req.body;

    let customer = await prisma.user.findUnique({ where: { phone: meetingData.customerPhone } });
    if (!customer) {
      customer = await prisma.user.create({
        data: { phone: meetingData.customerPhone, fullName: meetingData.customerName, role: 'CUSTOMER' }
      });
    }

    const newMeeting = await prisma.meeting.create({
      data: {
        projectId: meetingData.projectId,
        customerId: customer.id,
        builderId: meetingData.builderId,
        customerPhone: meetingData.customerPhone,
        customerName: meetingData.customerName,
        preferredDate: meetingData.preferredDate,
        preferredTime: meetingData.preferredTime,
        meetingType: meetingData.meetingType,
        notes: meetingData.notes,
        status: 'Pending'
      },
      include: { project: { select: { name: true } } }
    });

    // Notify the builder
    const builder = await prisma.builder.findUnique({
      where: { id: meetingData.builderId },
      select: { userId: true }
    });

    if (builder) {
      const projectName = newMeeting.project?.name ?? 'your project';
      const notifTitle = 'New Site Visit Request';
      const notifMessage = `${meetingData.customerName} wants to visit "${projectName}" on ${meetingData.preferredDate} at ${meetingData.preferredTime}.`;

      await prisma.notification.create({
        data: { userId: builder.userId, title: notifTitle, message: notifMessage, type: 'info', link: '/builder/meetings' }
      });

      channelManager.publish(`user:${builder.userId}`, {
        type: 'new_project',   // reusing the event type; frontend reads title/message
        title: notifTitle,
        message: notifMessage,
        city: '',
        timestamp: new Date().toISOString()
      });
    }

    res.json({ ok: true, data: { ...newMeeting, projectName: newMeeting.project?.name } });
  },

  // Accept or reject a meeting request; confirming creates a Deal (lead)
  updateMeetingStatus: async (req: Request, res: Response) => {
    const { builderId, meetingId } = req.params;
    const { status, notes: builderNotes, confirmedDate, confirmedTime } = req.body;

    const allowed = ['Confirmed', 'Cancelled', 'Completed', 'Follow-up Required'];
    if (!allowed.includes(status)) {
      res.status(400).json({ ok: false, message: `Invalid status. Allowed: ${allowed.join(', ')}` });
      return;
    }

    let meeting;
    try {
      meeting = await prisma.meeting.update({
        where: { id: Number(meetingId) },
        data: {
          status,
          ...(builderNotes  ? { builderNotes }  : {}),
          ...(confirmedDate ? { confirmedDate } : {}),
          ...(confirmedTime ? { confirmedTime } : {}),
        },
        include: { project: { select: { name: true } } },
      });
    } catch (err) {
      res.status(404).json({ ok: false, message: 'Meeting not found' });
      return;
    }

    // When builder confirms → ensure a Deal exists so the lead appears in Leads & Meetings
    if (status === 'Confirmed' && meeting.projectId) {
      try {
        const existing = await prisma.deal.findFirst({
          where: { builderId: Number(builderId), customerId: meeting.customerId, projectId: meeting.projectId },
          select: { id: true },
        });
        if (existing) {
          await prisma.deal.update({ where: { id: existing.id }, data: { status: 'Meeting Confirmed' } });
        } else {
          await prisma.deal.create({
            data: {
              builderId: Number(builderId),
              customerId: meeting.customerId,
              projectId: meeting.projectId,
              status: 'Meeting Confirmed',
            },
          });
        }
      } catch {
        // Deal sync is best-effort — don't fail the meeting update because of it
      }
    }

    // Notify the customer about the meeting status change
    const notifMeta: Record<string, { title: string; type: string; evtType: string }> = {
      Confirmed:            { title: 'Site Visit Confirmed',    type: 'success', evtType: 'meeting_confirmed' },
      Cancelled:            { title: 'Site Visit Cancelled',    type: 'error',   evtType: 'meeting_cancelled' },
      Completed:            { title: 'Site Visit Completed',    type: 'success', evtType: 'meeting_completed' },
      'Follow-up Required': { title: 'Follow-up Requested',     type: 'info',    evtType: 'meeting_followup'  },
    };
    const meta = notifMeta[status];
    if (meta) {
      const projectName = meeting.project?.name ?? 'your project';
      const dateStr     = meeting.confirmedDate ?? meeting.preferredDate;
      const msgByStatus: Record<string, string> = {
        Confirmed: `Your visit to "${projectName}" is confirmed for ${dateStr}.`,
        Cancelled: `Your visit to "${projectName}" has been cancelled.`,
        Completed: `Your visit to "${projectName}" is marked as completed.`,
        'Follow-up Required': `The builder has requested a follow-up for "${projectName}".`,
      };
      const notifMessage = msgByStatus[status] ?? `Your meeting status is now: ${status}.`;

      await prisma.notification.create({
        data: { userId: meeting.customerId, title: meta.title, message: notifMessage, type: meta.type, link: '/customer/meeting' },
      });

      channelManager.publish(`user:${meeting.customerId}`, {
        type: meta.evtType as any,
        title: meta.title,
        message: notifMessage,
        meetingId: meeting.id,
        city: '',
        link: '/customer/meeting',
        timestamp: new Date().toISOString(),
      });
    }

    res.json({ ok: true, data: { ...meeting, projectName: meeting.project?.name } });
  },

  // All deals for a builder with customer + project info
  getBuilderDeals: async (req: Request, res: Response) => {
    const { builderId } = req.params;
    const deals = await prisma.deal.findMany({
      where: { builderId: Number(builderId) },
      include: {
        customer: { select: { fullName: true, phone: true } },
        project:  { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    const mapped = deals.map(d => ({
      id: d.id,
      status: d.status,
      dealValue: d.dealValue,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
      customerId: d.customerId,
      customerName: d.customer?.fullName ?? 'Unknown',
      customerPhone: d.customer?.phone ?? '',
      projectId: d.projectId,
      projectName: d.project?.name ?? 'Unknown Project'
    }));
    res.json({ ok: true, data: mapped });
  },

  // All meetings for a specific builder
  getBuilderMeetings: async (req: Request, res: Response) => {
    const { builderId } = req.params;
    const meetings = await prisma.meeting.findMany({
      where: { builderId: Number(builderId) },
      include: { project: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });
    const mapped = meetings.map(m => ({
      ...m,
      projectName: m.project?.name ?? 'Unknown Project',
      project: undefined
    }));
    res.json({ ok: true, data: mapped });
  },

  // Customer meetings filtered by phone — flattens projectName
  getMeetings: async (req: Request, res: Response) => {
    const { phone } = req.query;
    const meetings = await prisma.meeting.findMany({
      where: { ...(phone ? { customerPhone: phone as string } : {}) },
      include: { project: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });
    const mapped = meetings.map(m => ({
      ...m,
      projectName: m.project?.name ?? 'Unknown Project',
      project: undefined
    }));
    res.json({ ok: true, data: mapped });
  },

  // SSE stream — registers builder in their personal user:${userId} channel
  streamNotifications: async (req: Request, res: Response) => {
    const userId = req.user!.id;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const channelKey = `user:${userId}`;
    channelManager.subscribe(channelKey, userId, res);

    res.write(`data: ${JSON.stringify({ type: 'connected', title: '', message: 'Notification stream connected', city: '', timestamp: new Date().toISOString() })}\n\n`);

    const heartbeat = setInterval(() => {
      try { res.write(': ping\n\n'); } catch { clearInterval(heartbeat); }
    }, 25_000);

    req.on('close', () => {
      clearInterval(heartbeat);
      channelManager.unsubscribe(channelKey, userId);
    });
  },

  getProjectPdf: async (req: Request, res: Response) => {
    const { projectId } = req.params;

    const project = await prisma.project.findUnique({
      where: { id: Number(projectId) },
      include: {
        builder: { select: { companyName: true, user: { select: { fullName: true } } } },
        documents: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!project) {
      res.status(404).json({ ok: false, message: 'Project not found' });
      return;
    }

    const fmt = (n: number) => {
      if (n >= 10_000_000) return `Rs. ${(n / 10_000_000).toFixed(2)} Cr`;
      if (n >= 100_000)    return `Rs. ${(n / 100_000).toFixed(0)} L`;
      return `Rs. ${n.toLocaleString('en-IN')}`;
    };
    const fmtPrice = (min?: number | null, max?: number | null) => {
      if (!min && !max) return 'Price on request';
      if (min && max)   return `${fmt(min)} - ${fmt(max)}`;
      return fmt(min || max || 0);
    };
    const builderName = project.builder?.companyName || project.builder?.user?.fullName || 'Builder';
    const location    = [project.address, project.city].filter(Boolean).join(', ') || project.city || '';

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${project.name.replace(/[^a-z0-9]/gi, '_')}_brochure.pdf"`);

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    doc.pipe(res);

    const TEAL      = '#0A7E8C';
    const ORANGE    = '#E87722';
    const DARK      = '#0F2035';
    const MUTED     = '#64748b';
    const LIGHT_BG  = '#f8fafc';
    const PAGE_W    = doc.page.width - 100;   // usable width (50 margins each side)

    /* ── Header banner ── */
    doc.rect(0, 0, doc.page.width, 72).fill(DARK);
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(20).text('DEALIO', 50, 22);
    doc.fillColor(ORANGE).font('Helvetica').fontSize(9).text('Real Estate Platform', 50, 46);
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(11)
      .text('PROJECT BROCHURE', 0, 28, { align: 'right', width: doc.page.width - 50 });
    doc.fillColor(TEAL).rect(0, 72, doc.page.width, 4).fill();

    /* ── Project title ── */
    doc.moveDown(1.5);
    doc.fillColor(DARK).font('Helvetica-Bold').fontSize(26).text(project.name, 50, 100);
    if (builderName) {
      doc.fillColor(MUTED).font('Helvetica').fontSize(12).text(`by ${builderName}`, 50, 132);
    }
    if (location) {
      doc.fillColor(MUTED).font('Helvetica').fontSize(10).text(`\u{1F4CD}  ${location}`, 50, 150);
    }

    /* ── Coloured accent line ── */
    doc.moveDown(0.5);
    const lineY = doc.y + 6;
    doc.rect(50, lineY, 40, 3).fill(ORANGE);
    doc.moveDown(1.2);

    /* ── Helper: section heading ── */
    const sectionHead = (title: string) => {
      doc.moveDown(0.6);
      doc.fillColor(TEAL).font('Helvetica-Bold').fontSize(11).text(title.toUpperCase());
      doc.moveDown(0.2);
      doc.moveTo(50, doc.y).lineTo(50 + PAGE_W, doc.y).strokeColor('#e2e8f0').lineWidth(1).stroke();
      doc.moveDown(0.4);
    };

    /* ── Key details grid ── */
    sectionHead('Key Details');
    const details: [string, string][] = [
      ['Price Range', fmtPrice(project.priceFrom, project.priceTo)],
      ['Status',      (project.status || '').replace(/_/g, ' ')],
      ['Possession',  project.possessionDate || '—'],
      ['Total Units', project.totalUnits != null ? String(project.totalUnits) : '—'],
      ['Available',   project.availableUnits != null ? String(project.availableUnits) : '—'],
      ['Booked',      project.bookedUnits != null ? String(project.bookedUnits) : '—'],
      ['Sold',        project.soldUnits != null ? String(project.soldUnits) : '—'],
    ];
    if (project.reraNumber) details.push(['RERA No.', project.reraNumber]);
    if (project.reraExpiry) details.push(['RERA Expiry', project.reraExpiry.slice(0, 10)]);

    const col = PAGE_W / 2;
    let gridX = 50, gridY = doc.y;
    details.forEach(([label, value], i) => {
      const x = gridX + (i % 2 === 0 ? 0 : col);
      const y = gridY + Math.floor(i / 2) * 28;
      doc.fillColor(MUTED).font('Helvetica').fontSize(8).text(label, x, y);
      doc.fillColor(DARK).font('Helvetica-Bold').fontSize(10).text(value, x, y + 10, { width: col - 10 });
    });
    doc.y = gridY + Math.ceil(details.length / 2) * 28 + 10;

    /* ── Configurations ── */
    const configs: string[] = (project as any).configurations ?? [];
    if (configs.length > 0) {
      sectionHead('Configurations');
      doc.fillColor(DARK).font('Helvetica').fontSize(10).text(configs.join('   /   '));
    }

    /* ── Description ── */
    if (project.description) {
      sectionHead('About the Project');
      doc.fillColor('#374151').font('Helvetica').fontSize(10).text(project.description, { lineGap: 4 });
    }

    /* ── Amenities ── */
    const amenities: string[] = (project as any).amenities ?? [];
    if (amenities.length > 0) {
      sectionHead('Amenities');
      const perRow = 3;
      const cellW  = PAGE_W / perRow;
      let ax = 50, ay = doc.y;
      amenities.forEach((a, i) => {
        const cx = ax + (i % perRow) * cellW;
        const cy = ay + Math.floor(i / perRow) * 22;
        doc.fillColor(TEAL).circle(cx + 4, cy + 5, 2.5).fill();
        doc.fillColor(DARK).font('Helvetica').fontSize(9).text(a, cx + 10, cy, { width: cellW - 14 });
      });
      doc.y = ay + Math.ceil(amenities.length / perRow) * 22 + 8;
    }

    /* ── Nearby highlights ── */
    const nearby: string[] = (project as any).nearbyHighlights ?? [];
    if (nearby.length > 0) {
      sectionHead('Nearby Highlights');
      doc.fillColor(DARK).font('Helvetica').fontSize(10).text(nearby.join('   •   '));
    }

    /* ── Documents list ── */
    if (project.documents.length > 0) {
      sectionHead('Available Documents');
      project.documents.forEach(d => {
        doc.fillColor(TEAL).font('Helvetica-Bold').fontSize(9).text(`${d.docType}:  `, { continued: true });
        doc.fillColor(MUTED).font('Helvetica').fontSize(9).text(d.name);
      });
    }

    /* ── Footer ── */
    const footerY = doc.page.height - 60;
    doc.rect(0, footerY, doc.page.width, 60).fill(DARK);
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(10)
      .text('DEALIO', 50, footerY + 14);
    doc.fillColor(ORANGE).font('Helvetica').fontSize(8)
      .text('India\'s Real Estate Platform', 50, footerY + 28);
    doc.fillColor('#ffffff').font('Helvetica').fontSize(7)
      .text(`Generated on ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}  |  dealio.in`, 0, footerY + 38, { align: 'right', width: doc.page.width - 50 });

    doc.end();
  },

  // Fetch and mark-read builder notifications
  getBuilderNotifications: async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const notifications = await prisma.notification.findMany({
      where: { userId, read: false },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    if (notifications.length > 0) {
      await prisma.notification.updateMany({
        where: { id: { in: notifications.map(n => n.id) } },
        data: { read: true }
      });
    }
    res.json({ ok: true, data: notifications });
  },

  // Follows a maps.app.goo.gl short link server-side and returns the expanded URL
  // so the client can extract precise coordinates (CORS blocks doing this in-browser).
  resolveMapsLink: async (req: Request, res: Response) => {
    const url = String(req.query.url ?? '');
    if (!url.startsWith('https://maps.app.goo.gl/') && !url.startsWith('https://goo.gl/maps/')) {
      return res.status(400).json({ ok: false, message: 'Only Google Maps short links are supported' });
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch(url, { redirect: 'follow', signal: controller.signal });
      return res.json({ ok: true, data: { resolvedUrl: response.url } });
    } catch (err) {
      const message = err instanceof Error && err.name === 'AbortError'
        ? 'Timed out resolving link'
        : 'Failed to resolve link';
      return res.status(502).json({ ok: false, message });
    } finally {
      clearTimeout(timeout);
    }
  }
};
